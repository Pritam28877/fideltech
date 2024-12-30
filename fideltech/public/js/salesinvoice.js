frappe.ui.form.on('Sales Invoice', {
    posting_date: function(frm) {
        if (frm.doc.posting_date) {
            // Parse the posting_date and calculate the due_date
            let posting_date = frappe.datetime.str_to_obj(frm.doc.posting_date);

            // Add 30 days to the posting_date
            let due_date = frappe.datetime.add_days(posting_date, 30);

            // Format the calculated date as YYYY-MM-DD
            due_date = frappe.datetime.obj_to_str(due_date);

            // Update the due_date field
            frm.set_value('due_date', due_date);
        }
    }
});
