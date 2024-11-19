# tasks.py

import frappe
from datetime import datetime, timedelta

def remind_timesheet_submission():
    """
    Reminds employees to submit timesheets 4 days before the end of the month.
    """
    today = datetime.today()
    last_day_of_month = (datetime(today.year, today.month + 1, 1) - timedelta(days=1)).day
    reminder_day = last_day_of_month - 4  # 4 days before month-end

    if today.day == reminder_day:
        send_timesheet_reminders()


def send_timesheet_reminders():
    """
    Send email reminders to employees who haven't submitted their timesheets.
    """
    # Fetch all employees
    employees = frappe.get_all('Employee', fields=['name', 'user_id', 'employee_name'])
    current_month = datetime.today().month
    current_year = datetime.today().year

    for employee in employees:
        user_id = employee.get('user_id')
        employee_name = employee.get('employee_name')

        # Check if the employee has submitted a timesheet for the current month
        timesheet_exists = frappe.db.exists(
            'Timesheet',
            {
                'owner': user_id,
                'month': current_month,
                'year': current_year
            }
        )

        if not timesheet_exists:
            # If no timesheet exists, send a reminder email
            send_email_reminder(employee_name, user_id)


def send_email_reminder(employee_name, user_id):
    """
    Sends a reminder email to the employee to fill their timesheet.
    """
    if not user_id:
        frappe.log_error(f"No user_id found for employee {employee_name}.")
        return

    subject = "Reminder: Please Fill Your Timesheet"
    message = f"""
    Dear {employee_name},

    This is a gentle reminder to fill in your timesheet for the current month. 
    Please ensure that it is submitted by the end of the month.

    Thank you for your cooperation.

    Best regards,
    Your HR Team
    """
    
    # Send email
    try:
        frappe.sendmail(
            recipients=[user_id],
            subject=subject,
            message=message
        )
        frappe.logger().info(f"Reminder email sent to {employee_name} ({user_id}).")
    except Exception as e:
        frappe.log_error(f"Failed to send email to {user_id}. Error: {str(e)}", "Timesheet Reminder Error")
