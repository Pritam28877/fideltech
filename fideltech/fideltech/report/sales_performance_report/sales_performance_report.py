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
        {"fieldname": "category", "label": _("Category"), "fieldtype": "Data", "width": 200},
        {"fieldname": "total_sales", "label": _("Total Sales (Currency)"), "fieldtype": "Currency", "width": 150},
        {"fieldname": "total_hours", "label": _("Total Hours/Units Sold"), "fieldtype": "Float", "width": 150},
        {"fieldname": "average_sale", "label": _("Average Sale per Transaction (Currency)"), "fieldtype": "Currency", "width": 150},
        {"fieldname": "total_payments", "label": _("Total Payments Received"), "fieldtype": "Currency", "width": 150},
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
        # Fetch data for customer-wise sales summary
        customer_sales = frappe.db.sql(f"""
            SELECT 
                'Customer-Wise' AS category,
                SUM(si.custom_grand_total_1) AS total_sales,
                SUM(ts.total_hours) AS total_hours,
                AVG(si.custom_grand_total_1) AS average_sale,
                SUM(si.paid_amount) AS total_payments
            FROM 
                `tabSales Invoice` si
            LEFT JOIN 
                `tabTimesheet` ts ON si.custom_timesheet = ts.name
            WHERE 
                {where_clause}
        """, filters, as_dict=True)

        # Fetch data for consultant-wise sales summary
        consultant_sales = frappe.db.sql(f"""
            SELECT 
                'Consultant-Wise' AS category,
                SUM(si.custom_grand_total_1) AS total_sales,
                SUM(ts.total_hours) AS total_hours,
                AVG(si.custom_grand_total_1) AS average_sale,
                SUM(si.paid_amount) AS total_payments
            FROM 
                `tabSales Invoice` si
            LEFT JOIN 
                `tabTimesheet` ts ON si.custom_timesheet = ts.name
            LEFT JOIN 
                `tabEmployee` e ON ts.employee = e.name
            WHERE 
                {where_clause}
        """, filters, as_dict=True)

        # Combine customer-wise and consultant-wise summaries
        data = customer_sales + consultant_sales
        
        return data
    except Exception as e:
        frappe.throw(_("Error fetching report data: {0}").format(str(e)))
