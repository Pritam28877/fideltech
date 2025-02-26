frappe.ui.form.on("Timesheet", {
    onload: function(frm) {
        if (frm.is_new()) {
            console.log("This is a new timesheet");
            frm.clear_table("time_logs");

            // Set the start and end date for the current month
            let currentDate = new Date();
            let firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            let lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            let start = new Date(firstDay);
            let end = new Date(lastDay);

            // Populate time_logs based on weekends and holidays
            populateTimeLogs(frm, start, end);
        } else {
            // console.log("This timesheet is not new.");
        }

        // Hide overtime columns for Contractors
        if (frappe.user.has_role("employee")) {
            frm.toggle_display("custom_overtime_hours_125", false);
            frm.toggle_display("custom_overtime_hours_135", false);
        }
    },
    refresh: function(frm) {
        frm.add_custom_button(__('View Timesheet Report'), function() {
            frappe.set_route('query-report', 'Timesheet Report User');
        }, __('Reports'));

        frm.add_custom_button(__('Download Blank Timesheet'), function() {
            frappe.call({
                method: "fideltech.fideltech.doctype.timesheet.timesheet.download_blank_timesheet",
                args: {},
                callback: function(response) {
                    if (response.message) {
                        window.open(response.message);
                    }
                }
            });
        }, __("Download"));

        if (frm.is_new()) {
            frm.clear_table("time_logs");

            // Set the start and end date for the current month
            let currentDate = new Date();
            let firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            let lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            let start = new Date(firstDay);
            let end = new Date(lastDay);

            // Populate time_logs based on weekends and holidays
            populateTimeLogs(frm, start, end);
        } else {
            // console.log("This timesheet is not new.");
        }

        // Hide overtime columns for Contractors
        if (frappe.user.has_role("employee")) {
            frm.toggle_display("custom_overtime_hours_125", false);
            frm.toggle_display("custom_overtime_hours_135", false);
        }
    },

    custom_select_month_timesheet: function(frm) {
        // When user selects a different month, update time logs
        frm.clear_table("time_logs");
        setTimesheetDates(frm);
    },

    custom_employee_rate_: function(frm, cdt, cdn) {
        calculate_time_and_amount(frm);
    },

    custom_holiday_list: function(frm) {
        // When custom_holiday_list is changed, clear and re-populate time_logs
        frm.clear_table("time_logs");

        let currentDate = new Date();
        let firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        let lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        let start = new Date(firstDay);
        let end = new Date(lastDay);

        if (frm.doc.custom_holiday_list) {
            fetchHolidays(frm.doc.custom_holiday_list, function(holidayDates) {
                populateTimeLogsWithHolidays(frm, start, end, holidayDates);
            });
        }
    }
});

// Function to fetch holidays based on the holiday list
function fetchHolidays(holidayList, callback) {
    frappe.call({
        method: "fideltech.fideltech.doctype.timesheet.timesheet.get_holidays",  // Replace with your actual method path
        args: {
            holiday_list_name: holidayList  // Pass the holiday list as an argument
        },
        callback: function(response) {
            if (response.message) {
                // console.log("Holidays found:", response.message);
                callback(response.message);  // Pass the holiday dates to the callback
            } else {
                console.error("No holidays found for the holiday list.");
                callback([]);  // Pass an empty array if no holidays found
            }
        }
    });
}
const japaneseDaysMap = new Map([
    [0, "日曜日"],  // Sunday
    [1, "月曜日"],  // Monday
    [2, "火曜日"],  // Tuesday
    [3, "水曜日"],  // Wednesday
    [4, "木曜日"],  // Thursday
    [5, "金曜日"],  // Friday
    [6, "土曜日"]   // Saturday
]);

const englishDaysMap = new Map([
    [0, "Sunday"],
    [1, "Monday"],
    [2, "Tuesday"],
    [3, "Wednesday"],
    [4, "Thursday"],
    [5, "Friday"],
    [6, "Saturday"]
]);

function getDayName(date) {
    const language = frappe.boot.lang; // Get the current language setting
    console.log("Language:", language);
    const dayIndex = date.getDay();
    if (language === "ja") {
        return japaneseDaysMap.get(dayIndex); // Return Japanese day name if language is Japanese
    } else {
        return englishDaysMap.get(dayIndex); // Return English day name otherwise
    }
}

// Function to populate time logs with weekends and holidays
function populateTimeLogs(frm, start, end) {
    while (start <= end) {
        let dayName = getDayName(start); // Get the day name based on the current language
        let hours = isWeekend(start) ? 0.00 : 8.00;

        frm.add_child("time_logs", {
            "custom_date": formatDate(start),  // Use Japanese format for date
            "custom_day": dayName,             // Use day name based on the current language
            "custom_regular_hours": hours,  
            "custom_overtime_hours_125": 0.00,  
            "custom_overtime_hours_135": 0.00,  
            "custom_sick": 0.00,  
            "custom_total": hours,  
            "hours": hours
        });

        start.setDate(start.getDate() + 1);
    }

    frm.refresh_field("time_logs");
    calculate_time_and_amount(frm);
}

// Function to populate time logs with holiday consideration
function populateTimeLogsWithHolidays(frm, start, end, holidayDates) {
    while (start <= end) {
        let dayName = getDayName(start); // Get the day name based on the current language
        let formattedDate = formatDate(start);
        
        // Set hours based on weekend or holiday
        let hours = isWeekend(start) || holidayDates.includes(formattedDate) ? 0.00 : 8.00;

        frm.add_child("time_logs", {
            "custom_date": formattedDate,
            "custom_day": dayName,
            "custom_regular_hours": hours,
            "custom_overtime_hours_125": 0.00,
            "custom_overtime_hours_135": 0.00,
            "custom_sick": 0.00,
            "custom_total": hours,
            "hours": hours
        });

        start.setDate(start.getDate() + 1);
    }

    frm.refresh_field("time_logs");
    calculate_time_and_amount(frm);
}

// Helper functions
function formatDate(date) {
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');  
    let day = String(date.getDate()).padStart(2, '0');  
    return `${year}-${month}-${day}`;  
}

// Function to get the day of the week for a date
function getDayName(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// Function to check if the date is a weekend (Saturday or Sunday)
function isWeekend(date) {
    let day = date.getDay();  // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;  // Returns true if the day is Sunday (0) or Saturday (6)
}


frappe.ui.form.on("Timesheet Detail", {
    custom_regular_hours: function (frm, cdt, cdn) {
        let child = locals[cdt][cdn];
        if (child.custom_regular_hours > 8) {
            frappe.msgprint(__('Regular hours can be max. 8'), __('Validation'));
            frappe.model.set_value(cdt, cdn, "custom_regular_hours", 8);
        }
        calculate_hours(frm, cdt, cdn);
    },
    custom_overtime_hours_125: function (frm, cdt, cdn) {
        calculate_hours(frm, cdt, cdn);
    },
    custom_overtime_hours_135: function (frm, cdt, cdn) {
        calculate_hours(frm, cdt, cdn);
    },
    custom_leave_type: function (frm, cdt, cdn) {
        // Recalculate hours and amounts when leave type is changed
        calculate_hours(frm, cdt, cdn);
    }
});

// Function to calculate hours and update the totals
function calculate_hours(frm, cdt, cdn) {
    var child = locals[cdt][cdn];

    if (frm._setting_hours) return; // Prevents recursive updates

    // Check the custom_leave_type field and adjust hours accordingly
    if (child.custom_leave_type === "Paid") {
        // Set regular hours to 0 and sick leave to 8 hours
        frappe.model.set_value(cdt, cdn, "custom_regular_hours", 0.00);
        frappe.model.set_value(cdt, cdn, "custom_sick", 8.00);
    } else if (child.custom_leave_type === "Unpaid") {
        // Set both regular hours and sick leave to 0 for Unpaid leave
        frappe.model.set_value(cdt, cdn, "custom_regular_hours", 0.00);
        frappe.model.set_value(cdt, cdn, "custom_sick", 0.00);
    }

    // Calculate total hours
    var total_hours = (child.custom_regular_hours || 0) + 
                      (child.custom_overtime_hours_125 || 0) + 
                      (child.custom_overtime_hours_135 || 0) + 
                      (child.custom_sick || 0);
    
    frappe.model.set_value(cdt, cdn, "custom_total", total_hours);
    frappe.model.set_value(cdt, cdn, "hours", total_hours);

    // Update time and amount calculations
    calculate_time_and_amount(frm);
}
var calculate_time_and_amount = function (frm) {
    // Check if holiday list is specified
    if (frm.doc.custom_holiday_list) {
        // Fetch holidays dynamically
        frappe.call({
            method: "fideltech.fideltech.doctype.timesheet.timesheet.get_holidays", // Replace with your actual method path
            args: {
                holiday_list_name: frm.doc.custom_holiday_list // Pass the holiday list as an argument
            },
            callback: function(response) {
                if (response.message) {
                    // console.log("Fetched Holidays:", response.message);
                    // Store holidays locally for calculations
                    let holidayDates = response.message;
                    performCalculations(frm, holidayDates); // Call the calculation function with holidays
                } else {
                    // console.log("No holidays found for the provided holiday list.");
                    performCalculations(frm, []); // Proceed with an empty holiday list
                }
            },
            error: function(error) {
                console.error("Error fetching holidays:", error);
                performCalculations(frm, []); // Proceed with an empty holiday list in case of errors
            }
        });
    } else {
        // console.log("No holiday list specified.");
        performCalculations(frm, []); // Proceed if no holiday list is specified
    }
};


function setTimesheetDates(frm) {
    console.log("Selected Month:", frm.doc.custom_select_month_timesheet);
    let selectedDate = frm.doc.custom_select_month_timesheet ? new Date(frm.doc.custom_select_month_timesheet) : new Date();
    let firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    let lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    if (frm.doc.custom_holiday_list) {
        fetchHolidays(frm.doc.custom_holiday_list, function(holidayDates) {
            populateTimeLogsWithHolidays(frm, firstDay, lastDay, holidayDates);
        });
    } else {
        populateTimeLogs(frm, firstDay, lastDay);
    }
}


function performCalculations(frm, holidayDates) {
    let tl = frm.doc.time_logs || [];
    let total_working_hr = 0;
    let custom_total_sick_hours = 0;
    let custom_total_regular_hours = 0;
    let custom_total_overtime_hours_125 = 0;
    let custom_total_overtime_hours_135 = 0;
    let custom_total_sick_hours_pay = 0;
    let custom_total_unpaid_leave_days = 0;
    let custom_total_unpaid_leave_hours = 0;
    let ifmonthordailyrate = 0;
    let custom_overtimerate = 0;

    let normal_pay = 0;
    let unpaid_deduction = 0;
    let custom_total_bill_amount = 0;
    let custom_monthordailyrate = 0

    let rate = frm.doc.custom_employee_rate_;
    let rate_type = frm.doc.custom_rate_type; // Hourly, Daily, Monthly
    let daily_hours = 8; // Standard working hours in a day
    let working_days_in_month = 0; // Average working days in a month
    let holidaypay = 0;
    let paidleavededuction = 0;

    // Process time logs
    for (var i = 0; i < tl.length; i++) {
        let formattedDate = tl[i].custom_date; // Ensure proper date format
        let isHolidayOrWeekend = isWeekend(new Date(formattedDate)) || holidayDates.includes(formattedDate);

        if (tl[i].custom_leave_type === "Unpaid") {
            custom_total_unpaid_leave_days++;
            custom_total_unpaid_leave_hours += daily_hours; // Full day unpaid leave adds 8 hours
        } else {
            total_working_hr += tl[i].custom_total;
            custom_total_regular_hours += tl[i].custom_regular_hours;
            custom_total_overtime_hours_125 += tl[i].custom_overtime_hours_125;
            custom_total_overtime_hours_135 += tl[i].custom_overtime_hours_135;
            custom_total_sick_hours += tl[i].custom_sick;

            // Include holidays as regular working days for pay
            if (holidayDates.includes(formattedDate) && tl[i].custom_regular_hours === 0) {
                holidaypay += daily_hours;
            }
            if(tl[i].custom_leave_type === "Paid") {
                paidleavededuction += tl[i].custom_total
            }

            // Calculate unpaid leave hours only on working days
            if (
                tl[i].custom_leave_type !== "Paid" &&
                !isHolidayOrWeekend &&
                tl[i].custom_regular_hours < daily_hours
            ) {
                custom_total_unpaid_leave_hours += daily_hours - tl[i].custom_regular_hours;
            }
        }
    }

    // Calculate rates based on type
    let daily_rate = rate;
    let hourly_rate = 0;
    custom_monthordailyrate = daily_rate;
    working_days_in_month = total_working_hr / daily_hours;
    if (rate_type === "Monthly") {
        working_days_in_month = 21.5;
        daily_rate = rate / working_days_in_month; // Calculate daily rate from monthly rate
        custom_monthordailyrate = daily_rate;
    } else if (rate_type === "Hourly") {
        daily_rate = rate * daily_hours; // Convert hourly rate to daily rate
        custom_monthordailyrate = rate;
    }

    // Calculate hourly rate
    hourly_rate = daily_rate / daily_hours;

    // Calculate normal pay
    let worked_days = working_days_in_month - custom_total_unpaid_leave_days; // Total worked days
    normal_pay = worked_days * daily_rate; // Regular pay for worked days
    // console.log("Normal Pay:", normal_pay);
    // Calculate holiday pay
    // holidaypay = (holidaypay /daily_hours) * daily_rate; // Convert holiday hours to pay
    // normal_pay = normal_pay - holidaypay;

    // Calculate sick hours pay
    custom_total_sick_hours_pay = (custom_total_sick_hours / daily_hours) * daily_rate; // Sick hours converted to pay

    // Calculate unpaid leave deduction
    unpaid_deduction = custom_total_unpaid_leave_hours * hourly_rate; // Deduct unpaid leave

    // Overtime calculations
    let custom_total_overtime_amount_125 = custom_total_overtime_hours_125 * hourly_rate * 1.25; // Overtime at 1.25x
    let custom_total_overtime_amount_135 = custom_total_overtime_hours_135 * hourly_rate * 1.35; // Overtime at 1.35x

    // Total bill amount
    // console.log("Total Bill Amount:", normal_pay );
    // console.log("Total 1 Amount:", custom_total_overtime_amount_125 );
    // console.log("Total 2 Amount:", custom_total_overtime_amount_135 );
    // console.log("Total 3 Amount:", holidaypay );
    custom_total_bill_amount =
        normal_pay +
        custom_total_overtime_amount_125 +
        custom_total_overtime_amount_135 ;

    // Update fields in the Timesheet
    // console.log("Total Working Hours:", total_working_hr);
    // console.log("paidleavededuction", paidleavededuction);
    total_working_hr = total_working_hr - paidleavededuction ;
    frm.set_value("total_hours", custom_total_regular_hours);
    frm.set_value("custom_total_ragular_hours_amount", custom_total_regular_hours);
    frm.set_value("custom_approx_total_regular_hours_amount", normal_pay);
    frm.set_value("custom_total_overtime_hours_125", custom_total_overtime_hours_125);
    frm.set_value("custom_total_overtime_hours_135", custom_total_overtime_hours_135);
    frm.set_value("custom_total_overtime_amount_125", custom_total_overtime_amount_125);
    frm.set_value("custom_total_overtime_amount_135", custom_total_overtime_amount_135);
    frm.set_value("custom_total_unpaid_leave_hours", custom_total_unpaid_leave_hours);
    // frm.set_value("custom_monthordailyrate", ifmonthordailyrate);
    frm.set_value("custom_total_sick_amount1", custom_total_sick_hours_pay);
    frm.set_value("custom_total_sick_hours", custom_total_sick_hours);
    frm.set_value("custom_total_unpaid_deduction", unpaid_deduction);
    frm.set_value("custom_monthordailyrate", custom_monthordailyrate);
    frm.set_value("custom_total_bill_amount", custom_total_bill_amount);
    frm.set_value("custom_overtimerate", hourly_rate * 1.35); // Calculate overtime rate
    frm.set_value("custom_overtimerate_125", hourly_rate * 1.25); // Calculate overtime rate
}



// Helper function to calculate working days in a month
function calculateWorkingDays(year, month) {
    let firstDay = new Date(year, month, 1);
    let lastDay = new Date(year, month + 1, 0);
    let workingDays = 0;

    while (firstDay <= lastDay) {
        let day = firstDay.getDay();
        if (day !== 0 && day !== 6) { // Exclude weekends
            workingDays++;
        }
        firstDay.setDate(firstDay.getDate() + 1);
    }

    return workingDays;
}


// Function to calculate first and last day based on selected month


frappe.listview_settings['Timesheet'] = {
    onload: function(listview) {
        // Ensure Delete button is available for Administrator in List View
        if (frappe.user.has_role('Administrator')) {
            listview.page.add_action_item(__('Delete'), function() {
                listview.call_for_selected_items('frappe.desk.reportview.delete', {
                    doctype: 'Timesheet'
                });
            });
        }
    }, 
    
    add_fields: ["workflow_state"],  // Add Workflow Status field to the list view
    get_indicator: function(doc) {
        if (doc.workflow_state === "Approved") {
            return ["Approved", "green", "workflow_state,=,Approved"];
        } else if (doc.workflow_state === "Rejected") {
            return ["Rejected", "red", "workflow_state,=,Rejected"];
        } else if (doc.workflow_state === "Pending Approval") {
            return ["Pending Approval", "orange", "workflow_state,=,Pending Approval"];
        } else {
            return ["Draft", "gray", "workflow_state,=,Draft"];
        }
    }
};
