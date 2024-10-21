import frappe

def on_timesheet_approve(doc, method):
    # Log the workflow state for debugging purposes
    frappe.logger("atarrrr").info(f"Workflow state: {doc}")

    if doc.workflow_state == "Approved":
        try:
            create_invoice_for_timesheet(doc)
        except Exception as e:
            frappe.logger().error(f"Error creating invoice for Timesheet {doc.name}: {str(e)}")
            frappe.msgprint(f"An error occurred while creating the invoice: {str(e)}")

def create_invoice_for_timesheet(timesheet):

    if frappe.db.exists("Sales Invoice", {"timesheet": timesheet.name}):
        return

    invoice = frappe.new_doc("Sales Invoice")
    invoice.customer = timesheet.customer
    invoice.due_date = frappe.utils.nowdate()
    invoice.timesheet = timesheet.name  

    for entry in timesheet.time_logs:
        invoice.append("items", {
            "item_code": "Timesheet Service",
            "qty": entry.hours,
            "rate": 100,  # Example rate
            "description": entry.activity_type or "Timesheet Activity"
        })

    invoice.insert()

        # Show a message indicating that the invoice has been created
        frappe.msgprint(f"Sales Invoice {invoice.name} has been created for Timesheet {timesheet.name}.")
    except Exception as e:
        # Log the error if invoice creation fails
        frappe.logger('timesheet').exception(e)
        frappe.msgprint(f"An error occurred while inserting the invoice: {str(e)}")
