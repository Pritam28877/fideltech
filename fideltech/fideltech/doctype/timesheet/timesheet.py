import frappe
from num2words import num2words  # Ensure you install num2words using `pip install num2words`

def number_to_words_international(amount):
    """
    Convert a number to words in the international format.

    Args:
        amount (float): The number to convert into words.

    Returns:
        str: The amount in words in international format.
    """
    try:
        # Ensure the amount is rounded to two decimal places
        amount = round(amount, 2)

        # Convert the amount to words using num2words
        amount_in_words = num2words(amount, lang='en', to='currency').capitalize()

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
            pass  # Log or handle the exception if needed

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

        tax_amount = timesheet.custom_total_bill_amount * 0.10
        invoice.due_date = frappe.utils.add_months(frappe.utils.nowdate(), 1)
        invoice.timesheet = timesheet.name
        invoice.employee_name = timesheet.employee_name  # Assuming custom field for employee
        invoice.currency = timesheet.currency
        invoice.custom_tax_amount = round(tax_amount, 2)
        invoice.custom_total1 = round(timesheet.custom_total_bill_amount, 2)
        invoice.custom_grand_total_1 = round(timesheet.custom_total_bill_amount + tax_amount, 2)

        total_amount_words = timesheet.custom_total_bill_amount + tax_amount

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
            qty = timesheet.total_hours / 8
        else:
            qty = timesheet.total_hours
        
        employee_data = frappe.db.get_value(
            "Employee",
            timesheet.employee,
            ["custom_consultrator_name_1", "custom_consultrator_id_1", "custom_service_period"],
            as_dict=True
        )

        invoice.custom_consultrator_name = employee_data.get("custom_consultrator_name_1")
        invoice.custom_consultrator_id = employee_data.get("custom_consultrator_id_1")
        invoice.custom_service_period = employee_data.get("custom_service_period")

        invoice.append("items", {
            "item_name": timesheet.employee_name,  # Employee name as item name
            "qty": qty,                            # Adjusted quantity based on rate type
            "rate": timesheet.custom_monthordailyrate,  # Custom rate per hour
            "description": timesheet.employee_name,  # Employee name as description
            "income_account": income_account,        # Set valid income account
            "custom_type": timesheet.custom_rate_type,
            "custom_amount1": timesheet.custom_total_bill_amount,
        })

        if overtime_hours_125 > 0 or overtime_hours_135 > 0:
            invoice.append("items", {
                "item_name": timesheet.employee_name,  # Employee name as item name
                "qty": overtime_hours_125 + overtime_hours_135,          # Total hours worked
                "rate": timesheet.custom_monthordailyrate,  # Custom rate per hour
                "description": "Overtime",  # Employee name as description
                "income_account": income_account,  # Set valid income account
                "custom_type": "Hourly",
                "custom_amount1": timesheet.custom_total_overtime_amount_125 + timesheet.custom_total_overtime_amount_135,
            })
        if timesheet.custom_total_unpaid_leave_hours > 0:
            invoice.append("items", {
                "item_name": timesheet.employee_name,  # Employee name as item name
                "qty": timesheet.custom_total_unpaid_leave_hours,          # Total hours worked
                "rate": timesheet.custom_monthordailyrate,  # Custom rate per hour
                "description": "Unpaid Leave",  # Employee name as description
                "income_account": income_account,  # Set valid income account
                "custom_type": "Hourly",
                "custom_amount1": timesheet.custom_total_unpaid_deduction,
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
