import frappe
from frappe import _

def execute(filters=None):
    filters = frappe._dict(filters or {})
    
    # Define the columns for the report
    columns = get_columns()
    
    # Fetch data for the report
    data = get_data(filters)
    
    return columns, data

def get_columns():
    return [
        {"fieldname": "consultant", "label": _("Consultant Name"), "fieldtype": "Link", "options": "Employee", "width": 200},
        {"fieldname": "month", "label": _("Month"), "fieldtype": "Data", "width": 100},
        {"fieldname": "project_description", "label": _("Project Description"), "fieldtype": "Data", "width": 250},
        {"fieldname": "quantity", "label": _("Quantity of Hours/Units"), "fieldtype": "Data", "width": 150},
        {"fieldname": "unit_rate", "label": _("Hourly/Monthly Unit Rate (Currency)"), "fieldtype": "Currency", "width": 200},
        {"fieldname": "total_sale", "label": _("Total Sale (Currency)"), "fieldtype": "Currency", "width": 150},
        {"fieldname": "customer", "label": _("Customer Name"), "fieldtype": "Link", "options": "Customer", "width": 200},
    ]

def get_data(filters):
    # Prepare query conditions based on filters
    conditions = []
    
    if filters.get("from_date"):
        conditions.append("si.posting_date >= %(from_date)s")
    if filters.get("to_date"):
        conditions.append("si.posting_date <= %(to_date)s")
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    try:
        # Fetch data using a SQL query
        data = frappe.db.sql(f"""
            SELECT 
                e.employee_name AS consultant,
                DATE_FORMAT(si.posting_date, '%%m/%%y') AS month,
                e.custom_project_id AS project_description,
                ts.total_hours AS quantity,
                e.custom_rate AS unit_rate,
                si.custom_grand_total_1 AS total_sale,
                si.customer AS customer
            FROM 
                `tabSales Invoice` si
            LEFT JOIN 
                `tabTimesheet` ts ON si.custom_timesheet = ts.name
            LEFT JOIN 
                `tabEmployee` e ON ts.employee = e.name
            WHERE 
                {where_clause}
            ORDER BY 
                e.employee_name, si.posting_date
        """, filters, as_dict=True)
        
        # Format data
        for row in data:
            row["quantity"] = f"{row['quantity']} hours" if row["quantity"] else "0 hours"
        
        return data
    except Exception as e:
        frappe.throw(_("Error fetching report data: {0}").format(str(e)))
