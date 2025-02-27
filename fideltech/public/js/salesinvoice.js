frappe.ui.form.on('Sales Invoice', {
    posting_date: function(frm) {
        if (frm.doc.posting_date) {
            // Parse the posting_date
            let posting_date = frappe.datetime.str_to_obj(frm.doc.posting_date);

            // Add 30 days to the posting_date
            let due_date = frappe.datetime.add_days(posting_date, 30);

            // Format the calculated date as YYYY-MM-DD
            due_date = frappe.datetime.obj_to_str(due_date);

            // Update the due_date field
            frm.set_value('due_date', due_date).then(() => {
                console.log("Due Date Updated to:", due_date);
            }).catch(err => {
                console.error("Error updating due_date:", err);
            });
        }
    }
});

frappe.ui.form.on('Sales Invoice', {
    custom_employee: function(frm) {
        if (frm.doc.custom_employee) {
            // Fetch the custom_rate from Employee Doctype
            frappe.db.get_value('Employee', frm.doc.custom_employee, 'custom_rate')
                .then(r => {
                    let custom_rate = r.message.custom_rate || 0;

                    // Store in a custom variable (not saved to database)
                    frm.custom_rate = custom_rate;

                    // Update all existing items
                    frm.doc.items.forEach(row => {
                        row.rate = custom_rate;
                        row.custom_amount1 = row.qty * row.rate;
                    });

                    frm.refresh_field('items');
                    calculate_totals(frm);
                });
        }
    },
    before_save: function(frm) {
        calculate_totals(frm);
    }
});

frappe.ui.form.on('Sales Invoice Item', {
    items_add: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        // Ensure rate is applied to new rows
        if (frm.custom_rate) {
            row.rate = frm.custom_rate;
            row.custom_amount1 = row.qty * row.rate;
            frm.refresh_field('items');
        }
    },
    rate: function(frm, cdt, cdn) {
        update_amount(frm, cdt, cdn);
    },
    qty: function(frm, cdt, cdn) {
        update_amount(frm, cdt, cdn);
    }
});

// Function to update amount when rate or qty changes
function update_amount(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    row.custom_amount1 = row.qty * row.rate;  // Calculate new amount

    frm.refresh_field('items');
    calculate_totals(frm);
}

// Function to calculate total, tax, and grand total
function calculate_totals(frm) {
    let custom_total1 = 0;

    frm.doc.items.forEach(row => {
        custom_total1 += row.custom_amount1 || 0;
    });

    let custom_tax_amount = custom_total1 * 0.10;
    let custom_grand_total_1 = custom_total1 + custom_tax_amount;

    frm.set_value('custom_total1', custom_total1);
    frm.set_value('custom_tax_amount', custom_tax_amount);
    frm.set_value('custom_grand_total_1', custom_grand_total_1);

    // Convert total to words
    frappe.call({
        method: 'fideltech.api.wordconverter.get_money_in_words',
        args: {
            amount: custom_grand_total_1,
            currency: frm.doc.currency
        },
        callback: function(r) {
            if (r.message) {
                frm.set_value('custom_in_words_1', r.message);
            }
        }
    });

    frm.refresh();
}
