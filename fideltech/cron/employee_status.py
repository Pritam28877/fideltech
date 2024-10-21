import frappe
from frappe.utils import getdate, add_months, nowdate

def check_employee_contract_status():
    # Get the current date
    today = getdate()

    # Get employees with custom_contract_date
    employees = frappe.get_all("Employee", filters={"custom_contract_date": ["is", "set"]}, fields=["name", "custom_contract_date"])

    for employee in employees:
        contract_date = getdate(employee.custom_contract_date)

        # Check if the contract date has passed
        if contract_date < today:
            # Set employee status to inactive
            frappe.db.set_value("Employee", employee.name, "status", "Inactive")
        
        # Check if it's one month before the contract date
        elif add_months(contract_date, -1) == today:
            # Send notification in the app
            message = f"Dear {employee.name}, your contract will expire on {contract_date}. Please take necessary actions."
            frappe.publish_realtime(
                event='notify',  # You can customize the event name
                message=message,
                user=employee.name  # Use the employee's name or ID to target the right user
            )
