export const DOCUMENT_CATEGORIES = [
  {
    name: "Recruitment",
    types: [
      { id: "offer_letter", label: "Offer Letter" },
      { id: "conditional_offer_letter", label: "Conditional Offer Letter" },
      { id: "internship_offer_letter", label: "Internship Offer Letter" },
      { id: "appointment_letter", label: "Appointment Letter" },
      { id: "joining_letter", label: "Joining Letter / Joining Confirmation" },
      { id: "candidate_rejection_letter", label: "Candidate Rejection Letter" },
      { id: "interview_invitation", label: "Interview Invitation" },
      { id: "interview_result_letter", label: "Interview Result Letter" }
    ]
  },
  {
    name: "Employment",
    types: [
      { id: "employment_agreement", label: "Employment Agreement" },
      { id: "nda", label: "NDA (Non-Disclosure Agreement)" },
      { id: "non_compete_agreement", label: "Non-Compete Agreement" },
      { id: "code_of_conduct_acknowledgement", label: "Code of Conduct Acknowledgement" },
      { id: "it_asset_agreement", label: "IT & Asset Agreement" },
      { id: "remote_work_agreement", label: "Remote Work Agreement" },
      { id: "probation_agreement", label: "Probation Agreement" },
      { id: "employee_handbook_acknowledgement", label: "Employee Handbook Acknowledgement" },
      { id: "bank_account_request_letter", label: "Bank Account Request Letter" },
      { id: "id_card_request_letter", label: "ID Card Request Letter" }
    ]
  },
  {
    name: "Salary & Payroll",
    types: [
      { id: "payslip", label: "Payslip" },
      { id: "salary_certificate", label: "Salary Certificate" },
      { id: "salary_increment_letter", label: "Salary Increment Letter" },
      { id: "bonus_letter", label: "Bonus Letter" },
      { id: "commission_letter", label: "Commission Letter" },
      { id: "incentive_letter", label: "Incentive Letter" },
      { id: "payroll_summary", label: "Payroll Summary" },
      { id: "income_certificate", label: "Income Certificate" },
      { id: "tax_certificate", label: "Tax Certificate" }
    ]
  },
  {
    name: "Attendance & Leave",
    types: [
      { id: "leave_approval_letter", label: "Leave Approval Letter" },
      { id: "leave_rejection_letter", label: "Leave Rejection Letter" },
      { id: "maternity_leave_letter", label: "Maternity Leave Letter" },
      { id: "paternity_leave_letter", label: "Paternity Leave Letter" },
      { id: "unpaid_leave_letter", label: "Unpaid Leave Letter" },
      { id: "work_from_home_approval", label: "Work From Home Approval" },
      { id: "attendance_certificate", label: "Attendance Certificate" }
    ]
  },
  {
    name: "Performance",
    types: [
      { id: "probation_evaluation", label: "Probation Evaluation" },
      { id: "probation_confirmation_letter", label: "Probation Confirmation Letter" },
      { id: "warning_letter", label: "Warning Letter" },
      { id: "show_cause_notice", label: "Show Cause Notice" },
      { id: "pip", label: "Performance Improvement Plan (PIP)" },
      { id: "appreciation_letter", label: "Appreciation Letter" },
      { id: "employee_recognition_certificate", label: "Employee Recognition Certificate" },
      { id: "promotion_letter", label: "Promotion Letter" },
      { id: "department_transfer_letter", label: "Department Transfer Letter" },
      { id: "role_change_letter", label: "Role Change Letter" },
      { id: "salary_revision_letter", label: "Salary Revision Letter" }
    ]
  },
  {
    name: "HR Requests",
    types: [
      { id: "noc", label: "No Objection Certificate (NOC)" },
      { id: "employment_verification_letter", label: "Employment Verification Letter" },
      { id: "visa_employment_letter", label: "Visa Employment Letter" },
      { id: "embassy_employment_letter", label: "Embassy Employment Letter" },
      { id: "bank_verification_letter", label: "Bank Verification Letter" },
      { id: "address_verification_letter", label: "Address Verification Letter" }
    ]
  },
  {
    name: "Separation",
    types: [
      { id: "resignation_acceptance_letter", label: "Resignation Acceptance Letter" },
      { id: "termination_letter", label: "Termination Letter" },
      { id: "experience_certificate", label: "Experience Certificate" },
      { id: "release_letter", label: "Relieving Letter / Release Letter" },
      { id: "full_and_final_settlement", label: "Full & Final Settlement Statement" },
      { id: "exit_interview_form", label: "Exit Interview Form" }
    ]
  }
];

export const getDocumentName = (type: string): string => {
  if (!type) return 'Document';
  try {
    const list = Array.isArray(DOCUMENT_CATEGORIES) ? DOCUMENT_CATEGORIES : [];
    for (const cat of list) {
      if (cat && Array.isArray(cat.types)) {
        const found = cat.types.find(t => t && t.id === type);
        if (found && found.label) return found.label;
      }
    }
  } catch (e) {}
  return String(type).split('_').map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '').join(' ');
};

export const getDocumentTitle = (type: string): string => {
  return getDocumentName(type).toUpperCase();
};

export const DEFAULT_TEMPLATES: Record<string, string> = {
  // Recruitment
  offer_letter: "We are delighted to extend this formal offer of employment to {employee_name} for the position of {designation} within the {department} department at {company_name}.\n\nKey Employment Highlights:\n• Joining Date: {joining_date}\n• Workplace Location: {work_location}\n• Working Days: {working_days}\n• Daily Working Hours: {working_hours}\n• Monthly Gross Salary: {basic_salary}\n• Paid Leave Entitlement: {holidays_count}\n• Probationary Period: {probation_period} months\n• Applicable Notice Period: {notice_period} days\n\nTerms & Conditions:\nPlease review the terms of this offer. This offer is contingent upon successful completion of background verification. To accept this offer, please sign and return a copy of this letter on or before the offer validity date. We look forward to welcoming you to {company_name}.",
  conditional_offer_letter: "We are pleased to offer you employment on a conditional basis for the position of {designation} in {department}.\n\nThis offer is contingent upon:\n1. Successful completion of background & reference verification.\n2. Verification of academic credentials and previous employment records.\n3. Confirmation of joining on or before {joining_date}.\n\nYour working schedule will be {working_hours} across {working_days} at {work_location}, with a monthly salary of {basic_salary}. Please return a signed copy to confirm acceptance.",
  internship_offer_letter: "We are delighted to offer {employee_name} an internship opportunity as {designation} in the {department} department at {company_name}.\n\nInternship Details:\n• Start Date: {joining_date}\n• Internship Duration: {probation_period} months\n• Work Location: {work_location}\n• Daily Schedule: {working_hours}, {working_days}\n• Stipend / Monthly Allowance: {basic_salary}\n\nThis internship is designed to provide hands-on experience and professional mentorship. We look forward to a productive learning journey with us.",
  appointment_letter: "With reference to your application and subsequent interviews, {company_name} is pleased to officially appoint {employee_name} (Employee Code: {employee_code}) to the position of {designation} in our {department} department.\n\n1. Effective Date & Location: Your appointment is effective from {joining_date} at our {work_location} office.\n2. Working Hours & Days: Your working hours will be {working_hours}, operating across {working_days}.\n3. Remuneration: You will receive a monthly basic salary of {basic_salary}, subject to applicable tax deductions.\n4. Leaves & Holidays: You will be eligible for {holidays_count} per calendar year.\n5. Probation & Notice: You will be on probation for {probation_period} months. Separation requires {notice_period} days notice from either party.\n\nPlease sign and return the duplicate copy of this letter as confirmation of your formal acceptance of these terms.",
  joining_letter: "This letter officially confirms that {employee_name} (Employee Code: {employee_code}) has successfully joined {company_name} as {designation} in the {department} department on {joining_date}.\n\nAll onboarding formalities, IT resource allocations, and HR registrations have been completed. Your official work schedule is {working_hours} across {working_days} at {work_location}. We warmly welcome you to our organization!",
  candidate_rejection_letter: "Thank you very much for taking the time to interview for the position of {designation} at {company_name}. We were highly impressed by your qualifications and professional background.\n\nHowever, after careful evaluation of all applicants, we have decided to proceed with another candidate whose specific experience aligns more closely with our current department needs. We will keep your profile on record for future openings.",
  interview_invitation: "We are pleased to invite {employee_name} for an interview for the {designation} position in the {department} department at {company_name}.\n\nThe interview will evaluate your technical expertise, project experience, and cultural fit with our team. Please confirm your availability for the scheduled time.",
  interview_result_letter: "We are pleased to inform {employee_name} that you have successfully cleared the recent interview rounds for the position of {designation} at {company_name}.\n\nOur HR team will contact you shortly to finalize your offer package and joining date.",

  // Employment
  employment_agreement: "1. Appointment & Joining Date\nThe Employee ({employee_name}, Code: {employee_code}) is appointed to the position of {designation} in the {department} department, effective from {joining_date}. The Employee agrees to perform all assigned duties with due diligence and professionalism.\n\n2. Working Hours & Work Schedule\nStandard working hours are {working_hours}, scheduled across {working_days}. The Employee may be requested to work reasonable additional hours to meet business demands.\n\n3. Work Location & Reporting\nThe Employee will be stationed at {work_location} and will report directly to their assigned department head or supervisor.\n\n4. Compensation & Basic Salary\nThe Employee's gross basic salary is {basic_salary} per month, payable in accordance with {company_name}'s standard payroll schedule.\n\n5. Probation Period & Performance Review\nThe Employee shall serve a probation period of {probation_period} months from {joining_date}. During probation, performance will be reviewed, and either party may terminate this agreement with {notice_period} days written notice.\n\n6. Annual Leave & Official Holidays\nThe Employee is entitled to {holidays_count} in addition to official public holidays declared by {company_name}.\n\n7. Confidentiality & Non-Disclosure\nThe Employee shall maintain strict confidentiality regarding all proprietary information, client records, source code, financial data, and business strategies of {company_name}, both during and after employment.\n\n8. Intellectual Property Rights\nAll work products, inventions, software, and creative works produced by {employee_name} during the tenure with {company_name} remain the exclusive property of the Company.",
  nda: "This Non-Disclosure Agreement (\"Agreement\") is made effective from {joining_date} between {company_name} and {employee_name} ({designation}, {department}).\n\n1. Confidential Information: {employee_name} acknowledges that during employment, they will have access to sensitive client data, trade secrets, software repositories, financial logs, and strategic plans of {company_name}.\n2. Obligations: {employee_name} agrees to hold all Confidential Information in strict confidence and shall not disclose, copy, or distribute any part thereof to unauthorized third parties.\n3. Duration: These confidentiality obligations shall remain binding during employment and shall survive indefinitely after separation from {company_name}.\n4. Remedies: Any breach of confidentiality will result in immediate termination of employment and legal action for monetary damages.",
  non_compete_agreement: "To protect {company_name}'s legitimate business interests, {employee_name} ({designation}) agrees that during their employment and for a period of 12 (twelve) months following separation, they will not directly or indirectly engage in, perform services for, or establish a competing business in the same industry within operating regions of {company_name}.",
  code_of_conduct_acknowledgement: "I, {employee_name} ({employee_code}), hereby acknowledge that I have received, read, and fully understood the Code of Conduct of {company_name}. I agree to abide by all the guidelines, ethical standards, and workplace policies described therein as a condition of my continued employment.",
  it_asset_agreement: "The Employee ({employee_name}, {designation}) acknowledges receipt of company IT assets (laptop, accessories, security badges). The Employee agrees to keep these assets secure, use them solely for official business during working hours ({working_hours}), and return them immediately upon separation from {company_name} in good working condition.",
  remote_work_agreement: "This agreement outlines the remote working arrangement for {employee_name} ({designation}, {department}). The Employee agrees to maintain a secure work environment at {work_location}, adhere to standard working hours ({working_hours}) across {working_days}, remain reachable via official channels, and meet all daily deliverables.",
  probation_agreement: "The Employee ({employee_name}) will undergo a probation period of {probation_period} months from {joining_date}. Performance and conduct will be reviewed regularly. {company_name} reserves the right to extend probation or terminate employment with {notice_period} days notice if benchmarks are not met.",
  employee_handbook_acknowledgement: "I, {employee_name}, confirm receipt of the {company_name} Employee Handbook. I understand it is my responsibility to read and comply with all policies regarding working hours ({working_hours}), leave policies ({holidays_count}), and code of conduct.",
  bank_account_request_letter: "This is to request the bank to open a salary account for our employee, {employee_name} ({designation}, Code: {employee_code}), employed since {joining_date}. Please issue standard corporate salary account facilities.",
  id_card_request_letter: "This is to request the issuance of an official company ID card and access badge for {employee_name} ({designation}, {department}). Please enable security access permissions for {work_location}.",

  // Salary & Payroll
  payslip: "This payslip provides the breakdown of salary earnings and deductions for {employee_name} ({employee_code}) for the current pay period.",
  salary_certificate: "This is to officially certify that {employee_name} (Employee Code: {employee_code}) is an active employee at {company_name}, holding the position of {designation} in the {department} department since {joining_date}.\n\nEmployee Salary Breakdown & Work Details:\n• Date of Joining: {joining_date}\n• Work Location: {work_location}\n• Standard Working Days: {working_days}\n• Daily Working Hours: {working_hours}\n• Monthly Gross Basic Salary: {basic_salary}\n\nThis certificate is issued upon the employee's request for verification purposes.",
  salary_increment_letter: "In recognition of your exceptional performance and valuable contributions to {company_name}, we are pleased to revise your monthly salary package to {new_salary}, effective from {effective_date}.\n\nAll other terms of your employment agreement executed on {joining_date} remain unchanged. Thank you for your hard work and commitment!",
  bonus_letter: "We are pleased to inform {employee_name} ({designation}) that you have been awarded a performance bonus of {new_salary} in recognition of your outstanding work and completion of major milestones at {company_name}.\n\nThis bonus will be credited with your upcoming salary payout. Thank you for your exemplary dedication!",
  commission_letter: "This letter outlines the sales commission structure for {employee_name} ({department}). Commission payouts will be calculated based on verified monthly targets achieved in addition to your basic salary of {basic_salary}.",
  incentive_letter: "We are pleased to inform {employee_name} that you have qualified for the quarterly performance incentive program at {company_name} due to your outstanding results in {department}.",
  payroll_summary: "This document provides the official payroll summary and compensation breakdown for {employee_name} ({employee_code}) for the specified pay period.",
  income_certificate: "This is to certify that {employee_name} ({designation}) has earned a total gross taxable income of {basic_salary} per month during their employment at {company_name} since {joining_date}.",
  tax_certificate: "This tax certificate verifies the total income earned and Tax Deducted at Source (TDS) for {employee_name} ({employee_code}) at {company_name} for the assessment period.",

  // Attendance & Leave
  leave_approval_letter: "We are pleased to inform {employee_name} ({designation}) that your leave request has been officially approved. Please ensure a proper task handover before proceeding on leave. Your total annual leave entitlement is {holidays_count}.",
  leave_rejection_letter: "We regret to inform {employee_name} that your leave request has been declined at this time due to critical operational requirements in the {department} department.",
  maternity_leave_letter: "This letter confirms the official approval of maternity leave for {employee_name} ({designation}). {company_name} wishes you health and well-being and looks forward to your return.",
  paternity_leave_letter: "This letter confirms the approval of paternity leave for {employee_name} ({designation}). {company_name} congratulates you on the new addition to your family!",
  unpaid_leave_letter: "Your request for unpaid leave of absence for {employee_name} has been approved under the terms discussed with HR.",
  work_from_home_approval: "We are pleased to approve the Work From Home request for {employee_name} ({designation}). Please adhere to standard working hours ({working_hours}) and remain reachable during working days ({working_days}).",
  attendance_certificate: "This certificate verifies the official attendance logs, shift hours ({working_hours}), and total active working days ({working_days}) recorded for {employee_name} ({employee_code}) at {company_name}.",

  // Performance
  probation_evaluation: "This document records the official probation performance evaluation for {employee_name} ({designation}, {department}) during their initial {probation_period} months from {joining_date}.",
  probation_confirmation_letter: "We are pleased to inform {employee_name} that you have successfully completed your probation period of {probation_period} months starting from {joining_date}.\n\nBased on your performance review in the {department} department as {designation}, {company_name} is delighted to confirm your employment as a permanent full-time team member effective {effective_date}.\n\nYour standard working hours remain {working_hours} across {working_days}, with an annual leave entitlement of {holidays_count}. We look forward to your continued success with us!",
  warning_letter: "This is an official warning letter issued to {employee_name} ({employee_code}) regarding performance or policy compliance issues in the {department} department. Immediate corrective action is required within {notice_period} days.",
  show_cause_notice: "You ({employee_name}, {designation}) are hereby requested to submit a written explanation within 48 hours why disciplinary action should not be initiated regarding the reported workplace incident.",
  pip: "This Performance Improvement Plan (PIP) is initiated for {employee_name} ({designation}) for a duration of {probation_period} months. Weekly reviews will monitor progress against key performance indicators.",
  appreciation_letter: "We express our sincere appreciation to {employee_name} ({designation}) for your outstanding efforts, dedication, and teamwork in {company_name}. Your contributions to the {department} department are highly valued!",
  employee_recognition_certificate: "This certificate is proudly awarded to {employee_name} (Code: {employee_code}) in recognition of exemplary performance, professionalism, and commitment to excellence at {company_name}.",
  promotion_letter: "In recognition of your exceptional performance, leadership, and dedication at {company_name}, we are thrilled to inform you of your promotion from {designation} to {new_designation} in the {department} department, effective {effective_date}.\n\nRevised Terms:\n• New Position: {new_designation}\n• Revised Monthly Gross Salary: {new_salary}\n• Effective Date: {effective_date}\n• Working Hours & Days: {working_hours}, {working_days}\n• Work Location: {work_location}\n\nAll other standard terms and conditions of your employment executed on {joining_date} remain in full force. Congratulations on this well-deserved advancement!",
  department_transfer_letter: "This letter notifies {employee_name} of your official transfer to the {department} department as {designation}, effective {effective_date}. Your working schedule remains {working_hours} across {working_days} at {work_location}.",
  role_change_letter: "This letter confirms the transition of {employee_name} ({employee_code}) to the new role of {new_designation} at {company_name}, effective {effective_date}.",
  salary_revision_letter: "This letter serves as official notification of a revision in the salary structure for {employee_name} ({designation}). Your updated monthly gross compensation will be {new_salary}, effective from {effective_date}.",

  // HR Requests
  noc: "This is to certify that {company_name} has no objection to {employee_name} ({designation}, Code: {employee_code}) pursuing higher education, professional certification, or personal travel as requested, provided it does not interfere with official duties during working hours ({working_hours}).",
  employment_verification_letter: "This is to verify that {employee_name} (Employee Code: {employee_code}) is currently employed with {company_name} as {designation} in the {department} department since {joining_date}.\n\nTheir current monthly basic salary is {basic_salary} and their work location is {work_location}. This letter is issued upon the employee's request for official verification.",
  visa_employment_letter: "This letter is issued to support the visa application for {employee_name}. We confirm that {employee_name} is actively employed with {company_name} as {designation} in the {department} department since {joining_date}.\n\nTheir monthly compensation is {basic_salary} and their leave for international travel has been duly approved.",
  embassy_employment_letter: "This letter is addressed to the Embassy to confirm that {employee_name} is employed at {company_name} as {designation} since {joining_date}. We confirm that they will resume duties at {work_location} upon completion of approved leave.",
  bank_verification_letter: "This letter confirms the active employment, date of joining ({joining_date}), designation ({designation}), and monthly salary credit ({basic_salary}) of {employee_name} ({employee_code}) at {company_name}.",
  address_verification_letter: "This is to confirm that the official residential address of {employee_name} ({designation}, {department}) as per {company_name}'s HR records is verified and up to date.",

  // Separation
  resignation_acceptance_letter: "We hereby formally accept your resignation from the position of {designation} at {company_name}. Your last working day with the company will be {relieving_date}.\n\nWe thank {employee_name} for your contributions during your tenure since {joining_date} and wish you the very best in your future endeavors.",
  experience_letter: "This is to certify that {employee_name} (Employee Code: {employee_code}) served at {company_name} as {designation} in the {department} department from {joining_date} to {relieving_date}.\n\nThroughout their tenure starting from {joining_date}, {employee_name} demonstrated exceptional technical proficiency, dedication, and professional ethics while adhering to our work schedule of {working_hours} across {working_days}.\n\nTheir monthly compensation during their last active tenure was {basic_salary}. Their conduct and performance were found to be exemplary. We extend our warmest wishes for their future career growth.",
  service_certificate: "This Service Certificate confirms that {employee_name} (Code: {employee_code}) was employed with {company_name} as {designation} from {joining_date} to {relieving_date}. They carried out all duties with diligence and professionalism.",
  relieving_letter: "This is to certify that {employee_name} (Employee Code: {employee_code}) was employed with {company_name} as {designation} in the {department} department from {joining_date} to {relieving_date}.\n\n{employee_name} has been officially relieved of all duties and responsibilities with effect from {relieving_date}. All company property, assets, access credentials, and financial accounts have been fully handed over and cleared.\n\nDuring their service period, their working hours were {working_hours} across {working_days}. We appreciate their contributions to {company_name} and wish them the best in their future professional endeavors.",
  full_final_settlement_letter: "This document provides the full and final settlement of accounts, accrued leave encashment, and outstanding dues for {employee_name} ({employee_code}) upon separation from {company_name} on {relieving_date}.",
  exit_clearance_letter: "This letter confirms that {employee_name} ({designation}) has successfully completed exit clearance formalities, returned all IT assets and access keys, and cleared all departmental dues with {company_name}.",
  exit_interview_form: "This form captures feedback and exit survey responses from {employee_name} ({designation}) upon separation from {company_name} on {relieving_date}.",
  termination_letter: "This letter serves as formal notification that your employment with {company_name} as {designation} in the {department} department is being terminated, effective {relieving_date}.\n\nPlease take note of the following transition steps:\n1. Outstanding Dues & Settlement: Your final wages, accrued leave payouts for {holidays_count}, and settlements will be calculated as of {relieving_date}.\n2. Property Handover: You are required to hand over all company assets, access keys, documents, and credentials on or before {relieving_date}.\n3. Confidentiality: You remain bound by the confidentiality and non-disclosure obligations executed upon your joining on {joining_date}.\n\nWe thank you for your services during your tenure and wish you the best in your future pursuits.",
  contract_completion_letter: "This letter marks the successful completion of the employment contract for {employee_name} ({designation}) with {company_name} from {joining_date} to {relieving_date}. We thank you for your valuable services.",

  // Legal & Compliance
  disciplinary_notice: "This formal notice is issued to {employee_name} ({employee_code}) regarding a policy breach in the {department} department. A written response is required within 48 hours.",
  suspension_letter: "You ({employee_name}, {designation}) are placed under suspension pending an inquiry into alleged misconduct. During suspension, access to {work_location} premises and systems is restricted.",
  warning_notice: "This formal warning notice is served to {employee_name} regarding workplace policy compliance. Immediate adherence to working hours ({working_hours}) and code of conduct is required.",
  final_warning_letter: "This is a Final Warning Notice issued to {employee_name} ({designation}). Any further violation of {company_name} policies will result in immediate termination of employment without further notice.",
  policy_violation_notice: "This notice details the policy violation observed for {employee_name} ({department}). Please review the employee handbook and sign the corrective action plan.",
  confidentiality_reminder: "This reminder notice emphasizes the ongoing confidentiality obligations of {employee_name} ({designation}) regarding proprietary software, client data, and business strategies of {company_name}.",
  legal_notice: "This legal notice is served to {employee_name} regarding breach of contract terms under the employment agreement executed on {joining_date}.",

  // Assets
  asset_issue_form: "This form records the issuance of company IT assets, laptop hardware, and access keys to {employee_name} ({designation}, {department}) at {work_location} on {joining_date}.",
  asset_return_form: "This form verifies the physical inspection and return of all company assets handed back by {employee_name} ({employee_code}) upon separation on {relieving_date}.",
  laptop_handover: "This handover document confirms receipt of official laptop hardware and security credentials by {employee_name} ({designation}) for official duties during working hours ({working_hours}).",
  sim_card_handover: "This document confirms issuance of corporate SIM card and mobile communication facilities to {employee_name} ({department}) for business use.",
  access_card_handover: "This document records issuance of official office entry access badge for {employee_name} at {work_location}.",
  asset_damage_report: "This report documents physical inspection and repair cost assessment for damaged company property assigned to {employee_name}.",

  // Training
  training_invitation: "You ({employee_name}, {designation}) are invited to attend the professional skill development workshop organized by {company_name} for the {department} department.",
  training_completion_certificate: "This Certificate of Completion is awarded to {employee_name} ({employee_code}) for successfully completing the advanced training program conducted by {company_name}.",
  training_attendance_certificate: "This certificate verifies active participation and attendance of {employee_name} in official corporate training sessions.",
  skill_assessment_report: "This report summarizes the technical skill assessment and performance feedback for {employee_name} ({designation}) in the {department} department.",

  // Internal Documents
  internal_memo: "INTERNAL MEMORANDUM: Guidelines regarding office decorum, shift timings ({working_hours}), working days ({working_days}), and IT security compliance for all staff members at {company_name}.",
  circular: "OFFICIAL CIRCULAR: Notification to all employees regarding upcoming public holidays ({holidays_count}) and updated company operating hours ({working_hours}) at {work_location}.",
  company_announcement: "COMPANY ANNOUNCEMENT: {company_name} is pleased to share organizational milestones, new project additions, and team recognitions across all departments.",
  policy_update_notice: "NOTICE OF POLICY UPDATE: All employees ({employee_name}) are requested to review updated HR guidelines regarding leave entitlements ({holidays_count}) and remote work protocols.",
  holiday_notice: "HOLIDAY ANNOUNCEMENT: Please be informed that all offices of {company_name} will remain closed on the upcoming official public holiday. We wish everyone a restful break!"
};

export const resolveTemplate = (
    templateText: string,
    employee: any,
    activeDesignation: string,
    activeDepartment: string,
    companyName: string,
    joiningDate: string,
    relievingDate: string,
    probationPeriod: string,
    newDesignation: string,
    newSalary: string,
    workingDays: string = 'Sunday through Thursday',
    workingHours: string = '9:00 AM to 6:00 PM',
    annualLeave: string = '20 Days Paid Annual Leave',
    noticePeriod: string = '30 Days',
    workLocation: string = ''
) => {
    if (!templateText) return '';
    if (!employee) return templateText;

    const branchName = employee.branch || '';
    const branchAddress = employee.branch_address || workLocation || '';

    return templateText
        .replace(/{employee_name}/g, employee.name || '')
        .replace(/{employee_code}/g, employee.employee_id_code || '')
        .replace(/{designation}/g, activeDesignation)
        .replace(/{department}/g, activeDepartment)
        .replace(/{company_name}/g, companyName)
        .replace(/{joining_date}/g, joiningDate)
        .replace(/{relieving_date}/g, relievingDate)
        .replace(/{probation_period}/g, probationPeriod)
        .replace(/{notice_period}/g, noticePeriod)
        .replace(/{working_days}/g, workingDays)
        .replace(/{working_hours}/g, workingHours)
        .replace(/{holidays_count}/g, annualLeave)
        .replace(/{work_location}/g, workLocation || branchAddress)
        .replace(/{branch_name}/g, branchName)
        .replace(/{branch_address}/g, branchAddress)
        .replace(/{basic_salary}/g, employee.basic_salary ? `$${employee.basic_salary}` : '')
        .replace(/{new_designation}/g, newDesignation || '[New Designation]')
        .replace(/{new_salary}/g, newSalary || '[New Salary]');
};
