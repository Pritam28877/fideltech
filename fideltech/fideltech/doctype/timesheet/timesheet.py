import frappe
import pandas as pd
from frappe.utils.file_manager import save_file
from frappe.utils import get_site_path

def number_to_words_international(amount):
    """
    Convert a number to words in the international format without currency names.

    Args:
        amount (float): The number to convert into words.

    Returns:
        str: The amount in words in international format, without currency names.
    """
    try:
        # Ensure the amount is rounded to two decimal places
        amount = round(amount, 2)

        # Split the amount into whole and decimal parts
        whole_part = int(amount)
        decimal_part = int(round((amount - whole_part) * 100))

        # Convert the whole part to words
        whole_part_in_words = num2words(whole_part, lang='en', to='cardinal').capitalize()

        # Convert the decimal part to words, if it exists
        if decimal_part > 0:
            decimal_part_in_words = num2words(decimal_part, lang='en', to='cardinal')
            amount_in_words = f" {whole_part_in_words}"
        else:
            amount_in_words =f" {whole_part_in_words}"

        return amount_in_words + " only"
    except Exception as e:
        frappe.logger('utils').exception(f"Error converting number to words: {str(e)}")
        return ""

def on_timesheet_approve(doc, method):
    frappe.logger("t1").info(f"Workflow state: {doc}")

    if doc.workflow_state == "Approved":
        try:
            create_invoice_for_timesheet(doc)
        except Exception as e:
            frappe.logger('utils').exception(f"Error during invoice creation: {str(e)}")


def create_invoice_for_timesheet(timesheet):
    # Check if an invoice already exists for the timesheet
    if frappe.db.exists("Sales Invoice", {"timesheet": timesheet.name}):
        return

    try:
        # Create a new Sales Invoice
        invoice = frappe.new_doc("Sales Invoice")
        qty = 0

        # Ensure customer is set
        if not timesheet.custom_customer_name:
            frappe.throw("Customer is missing in Timesheet")
        invoice.customer = timesheet.custom_customer_name
        invoice.custom_timesheet = timesheet.name
        customer_data = frappe.db.get_value(
        "Customer",
        timesheet.custom_customer_name,
        ["tax_id",  "custom_tax_no" ,"custom_attn"],
        as_dict=True
        )
        invoice.tax_id = customer_data.get("tax_id")
        invoice.custom_tax_no = customer_data.get("custom_tax_no")
        invoice.custom_attn = customer_data.get("custom_attn")

        tax_amount = timesheet.custom_total_bill_amount * 0.10
        # invoice.due_date = frappe.utils.add_months(frappe.utils.nowdate(), 1)
        # Calculate the last day of the next month
        next_month_date = frappe.utils.add_months(frappe.utils.nowdate(), 1)
        today = frappe.utils.nowdate()

        # Get the last day of the month for the new date
        plus_30_days_date = datetime.strptime(today, "%Y-%m-%d") + timedelta(days=30)
        # Set the due date to the last day of the next month
        invoice.due_date = plus_30_days_date

        invoice.timesheet = timesheet.name
        invoice.employee_name = timesheet.employee_name  # Assuming custom field for employee
        invoice.currency = timesheet.currency
        invoice.custom_tax_amount = round(tax_amount, 2)
        invoice.custom_total1 = round(timesheet.custom_total_bill_amount, 2)
        invoice.custom_grand_total_1 = round(timesheet.custom_total_bill_amount + tax_amount)

        total_amount_words = round(timesheet.custom_total_bill_amount + tax_amount)
        invoice.custom_employname = timesheet.employee_name
        invoice.custom_employid = timesheet.employee


        # Use the international format for amount in words
        invoice.custom_in_words_1 = number_to_words_international(total_amount_words)

        overtime_hours_125 = int(timesheet.custom_total_overtime_hours_125 or 0)
        overtime_hours_135 = int(timesheet.custom_total_overtime_hours_135 or 0)

        # Get default income account for the company
        income_account = frappe.get_value("Company", timesheet.company, "default_income_account")
        if not income_account:
            frappe.throw(f"Please set the default income account for the company {timesheet.company}")

        # Append an item to the invoice
        if timesheet.custom_rate_type == "Monthly":
            qty = 1
        elif timesheet.custom_rate_type == "Daily":
            qty = timesheet.custom_total_ragular_hours_amount / 8
        else:
            qty = timesheet.custom_total_ragular_hours_amount
        
        employee_data = frappe.db.get_value(
            "Employee",
            timesheet.employee,
            ["employee_name",  "custom_service_period" , "custom_project_id" , "custom_ref_id" , "designation"],
            as_dict=True
        )
        # employee_id = employee_data.get("custom_consultrator_id_1")

        invoice.custom_consultrator_name = employee_data.get("employee_name")
        invoice.custom_consultrator_id = employee_data.get("custom_ref_id")
        invoice.custom_service_period = employee_data.get("custom_service_period")
        invoice.custom_project_name = employee_data.get("custom_project_id")
        invoice.custom_designation = employee_data.get("designation")
        total_aproximate_hours = timesheet.custom_approx_total_regular_hours_amount + timesheet.custom_total_unpaid_deduction
        custom_type = "Hour"

        if timesheet.custom_rate_type == "Monthly":
            custom_type = "Man Month"
        elif timesheet.custom_rate_type == "Daily":
            custom_type = "Days"
        elif timesheet.custom_rate_type == "Hourly":
            custom_type = "Hour"



        invoice.append("items", {
            "item_name": timesheet.employee_name if not employee_data.get("custom_ref_id") else timesheet.employee_name + " (" + employee_data.get("custom_ref_id") + ")" ,# Employee name as item name
            "qty": qty,                            # Adjusted quantity based on rate type
            "rate": timesheet.custom_employee_rate_,  # Custom rate per hour
            "description": timesheet.employee_name,  # Employee name as description
            "income_account": income_account,        # Set valid income account
            "custom_type": custom_type,
            "custom_amount1": total_aproximate_hours,
        })

        if overtime_hours_125 > 0:
            invoice.append("items", {
                "item_name": timesheet.employee_name if not employee_data.get("custom_ref_id") else timesheet.employee_name + " (" + employee_data.get("custom_ref_id") + ")",   # Employee name as item name
                "qty": overtime_hours_125 ,          # Total hours worked
                "rate": timesheet.custom_overtimerate_125,  # Custom rate per hour
                "description": "Overtime 1.25" ,  # Employee name as description
                "income_account": income_account,  # Set valid income account
                "custom_type": "Hour",
                "custom_amount1": timesheet.custom_total_overtime_amount_125 ,
            })

        if overtime_hours_135 > 0 :
            invoice.append("items", {
                "item_name": timesheet.employee_name if not employee_data.get("custom_ref_id") else timesheet.employee_name + " (" + employee_data.get("custom_ref_id") + ")",   # Employee name as item name
                "qty": overtime_hours_135 ,          # Total hours worked
                "rate": timesheet.custom_overtimerate,  # Custom rate per hour
                "description": "Overtime 1.35",  # Employee name as description
                "income_account": income_account,  # Set valid income account
                "custom_type": "Hour",
                "custom_amount1":  timesheet.custom_total_overtime_amount_135,
            })
        if timesheet.custom_total_unpaid_leave_hours > 0:
            unpaid_leave_qty = timesheet.custom_total_unpaid_leave_hours
            
            # Convert hours to days if rate type is "Monthly" or "Daily"
            if timesheet.custom_rate_type in ["Monthly", "Daily"]:
                unpaid_leave_qty = unpaid_leave_qty / 8  # Convert hours to days

            invoice.append("items", {
                "item_name": timesheet.employee_name if not employee_data.get("custom_ref_id") else timesheet.employee_name + " (" + employee_data.get("custom_ref_id") + ")",   # Employee name as item name
                "qty": round(unpaid_leave_qty, 2),     # Total unpaid leave converted to days
                "rate": timesheet.custom_monthordailyrate,  # Custom rate per day
                "description": "Unpaid Leave",  # Description
                "income_account": income_account,  # Set valid income account
                "custom_type": "Days" if timesheet.custom_rate_type in ["Daily", "Monthly"] else "Hour",
                "custom_amount1": -abs(float(timesheet.custom_total_unpaid_deduction)), 
            })


        # Insert the invoice
        invoice.insert()

        # Optionally, show a success message
        frappe.msgprint(f"Sales Invoice {invoice.name} has been created for Timesheet {timesheet.name}.")

    except Exception as e:
        # Log the error if invoice creation fails
        frappe.logger('timesheet').exception(e)
        frappe.msgprint(f"An error occurred while inserting the invoice: {str(e)}")

@frappe.whitelist(allow_guest=True)
def get_holidays(holiday_list_name):
    """
    Fetches holidays from the given holiday list.
    :param holiday_list_name: Name of the holiday list
    :return: List of holiday dates
    """
    if not holiday_list_name:
        return []

    # Fetch the holiday list document
    holiday_list = frappe.get_doc("Holiday List", holiday_list_name)

    # Extract holiday dates from the holidays child table
    holiday_dates = [holiday.holiday_date for holiday in holiday_list.holidays]

    return holiday_dates



@frappe.whitelist()
def download_blank_timesheet():
    # Define column headers for the blank timesheet
    columns = ["Date", "Day", "Regular Hours", "Overtime 1.25x", "Overtime 1.35x", "Leave Type", "Total Hours"]

    # Create an empty DataFrame
    df = pd.DataFrame(columns=columns)

    # Define file name
    file_name = "Blank_Timesheet.xlsx"
    file_path = get_site_path("private", "files", file_name)

    # Save to an Excel file
    df.to_excel(file_path, index=False)

    # Save file in Frappe and return download URL
    file_doc = save_file(file_name, open(file_path, "rb").read(), "Timesheet", None, is_private=1)
    
    return file_doc.file_url  # Return the file URL for downloading