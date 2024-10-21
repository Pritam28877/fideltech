import frappe

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

        # Ensure customer is set
        if not timesheet.custom_customer_name:
            frappe.throw("Customer is missing in Timesheet")
        invoice.customer = timesheet.custom_customer_name
        
        invoice.due_date = frappe.utils.nowdate()
        invoice.timesheet = timesheet.name
        invoice.employee_name = timesheet.employee_name  # Assuming custom field for employee
        invoice.currency = timesheet.currency

        # Get default income account for the company
        income_account = frappe.get_value("Company", timesheet.company, "default_income_account")
        if not income_account:
            frappe.throw(f"Please set the default income account for the company {timesheet.company}")

        # Append an item to the invoice
        invoice.append("items", {
            "item_name": timesheet.employee_name,  # Employee name as item name
            "qty": timesheet.total_hours,          # Total hours worked
            "rate": timesheet.custom_employee_rate_,  # Custom rate per hour
            "description": timesheet.employee_name,  # Employee name as description
            "income_account": income_account,  # Set valid income account
            "amount": timesheet.custom_total_bill_amount  # Total bill amount
        })

        # Insert the invoice
        invoice.insert()

        # Optionally, show a success message
        frappe.msgprint(f"Sales Invoice {invoice.name} has been created for Timesheet {timesheet.name}.")

    except Exception as e:
        # Log the error if invoice creation fails
        frappe.logger('timesheet').exception(e)
        frappe.msgprint(f"An error occurred while inserting the invoice: {str(e)}")
