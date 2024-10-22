
import frappe

def execute(filters=None):
    columns = [
        {"label": "Employee Name", "fieldname": "employee_name", "fieldtype": "Data", "width": 200},
        {"label": "Gender", "fieldname": "gender", "fieldtype": "Data", "width": 100},
        {"label": "Date of Birth", "fieldname": "date_of_birth", "fieldtype": "Date", "width": 100},
        {"label": "Custom Project ID", "fieldname": "custom_project_id", "fieldtype": "Data", "width": 150},
        {"label": "Custom Ref ID", "fieldname": "custom_ref_id", "fieldtype": "Data", "width": 150},
        {"label": "Custom Rate", "fieldname": "custom_rate", "fieldtype": "Currency", "width": 100},
        {"label": "Custom Client Name", "fieldname": "custom_client_name", "fieldtype": "Data", "width": 200},
        {"label": "Custom Contract Date", "fieldname": "custom_contract_date", "fieldtype": "Date", "width": 100},
    ]

    # Fetch active employees
    data = frappe.db.get_all('Employee',
        filters={'status': 'Active'},
        fields=[
            'employee_name',
            'gender',
            'date_of_birth',
            'custom_project_id',
            'custom_ref_id',
            'custom_rate',
            'custom_client_name',
            'custom_contract_date'
        ]
    )

    return columns, data
