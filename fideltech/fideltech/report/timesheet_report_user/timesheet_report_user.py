import frappe
from frappe.utils import getdate, nowdate, get_first_day, get_last_day

def execute(filters=None):
    if not filters:
        filters = {}

    # Automatically set start and end date to first and last day of the current month if not provided
    today = getdate(nowdate())
    start_date = get_first_day(today)
    end_date = get_last_day(today)

    if filters.get("start_date"):
        start_date = getdate(filters.get("start_date"))
    
    if filters.get("end_date"):
        end_date = getdate(filters.get("end_date"))

    # Define report columns including missing fields
    columns = [
        {"label": "Day", "fieldname": "custom_day", "fieldtype": "Data", "width": 120},
        {"label": "Date", "fieldname": "custom_date", "fieldtype": "Date", "width": 120},
        {"label": "Regular Hours", "fieldname": "custom_regular_hours", "fieldtype": "Float", "width": 120},
        {"label": "Overtime Hours (125%)", "fieldname": "custom_overtime_hours_125", "fieldtype": "Float", "width": 120},
        {"label": "Overtime Hours (135%)", "fieldname": "custom_overtime_hours_135", "fieldtype": "Float", "width": 120},
        {"label": "Sick Leave", "fieldname": "custom_sick", "fieldtype": "Float", "width": 120},
        {"label": "Total Hours", "fieldname": "custom_total", "fieldtype": "Float", "width": 120},
        {"label": "Work Content", "fieldname": "custom_work_content", "fieldtype": "Data", "width": 150},
        {"label": "Vacation (Leave Type)", "fieldname": "custom_leave_type", "fieldtype": "Data", "width": 150},
        {"label": "Office/Home", "fieldname": "custom_office_home", "fieldtype": "Data", "width": 150},
    ]

    conditions = "1=1"
    values = {
        "start_date": start_date,
        "end_date": end_date
    }

    # Apply filters
    if filters.get("employee"):
        conditions += " AND parent.employee = %(employee)s"
        values["employee"] = filters.get("employee")

    if filters.get("custom_customer_name"):
        conditions += " AND parent.custom_customer_name = %(custom_customer_name)s"
        values["custom_customer_name"] = filters.get("custom_customer_name")

    conditions += " AND child.custom_date BETWEEN %(start_date)s AND %(end_date)s"

    # Fetch data including the missing columns
    data = frappe.db.sql(
        f"""
        SELECT 
            child.custom_day, 
            child.custom_date, 
            child.custom_regular_hours, 
            child.custom_overtime_hours_125, 
            child.custom_overtime_hours_135, 
            child.custom_sick, 
            child.custom_total,
            child.custom_work_content,
            child.custom_leave_type,
            child.custom_office_home
        FROM `tabTimesheet Detail` AS child
        INNER JOIN `tabTimesheet` AS parent ON child.parent = parent.name
        WHERE {conditions}
        ORDER BY child.custom_date ASC
        """,
        values,
        as_dict=True
    )

    return columns, data
