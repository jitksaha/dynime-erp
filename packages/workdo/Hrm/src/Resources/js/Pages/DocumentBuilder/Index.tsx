import { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Printer, FileText, Mail, Globe, Phone, PenTool } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { toast } from 'sonner';

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
      { id: "experience_letter", label: "Experience Letter" },
      { id: "service_certificate", label: "Service Certificate" },
      { id: "relieving_letter", label: "Relieving Letter" },
      { id: "full_final_settlement_letter", label: "Full & Final Settlement Letter" },
      { id: "exit_clearance_letter", label: "Exit Clearance Letter" },
      { id: "exit_interview_form", label: "Exit Interview Form" },
      { id: "termination_letter", label: "Termination Letter" },
      { id: "contract_completion_letter", label: "Contract Completion Letter" }
    ]
  },
  {
    name: "Legal & Compliance",
    types: [
      { id: "disciplinary_notice", label: "Disciplinary Notice" },
      { id: "suspension_letter", label: "Suspension Letter" },
      { id: "warning_notice", label: "Warning Notice" },
      { id: "final_warning_letter", label: "Final Warning Letter" },
      { id: "policy_violation_notice", label: "Policy Violation Notice" },
      { id: "confidentiality_reminder", label: "Confidentiality Reminder" },
      { id: "legal_notice", label: "Legal Notice" }
    ]
  },
  {
    name: "Assets",
    types: [
      { id: "asset_issue_form", label: "Asset Issue Form" },
      { id: "asset_return_form", label: "Asset Return Form" },
      { id: "laptop_handover", label: "Laptop Handover" },
      { id: "sim_card_handover", label: "SIM Card Handover" },
      { id: "access_card_handover", label: "Access Card Handover" },
      { id: "asset_damage_report", label: "Asset Damage Report" }
    ]
  },
  {
    name: "Training",
    types: [
      { id: "training_invitation", label: "Training Invitation" },
      { id: "training_completion_certificate", label: "Training Completion Certificate" },
      { id: "training_attendance_certificate", label: "Training Attendance Certificate" },
      { id: "skill_assessment_report", label: "Skill Assessment Report" }
    ]
  },
  {
    name: "Internal Documents",
    types: [
      { id: "internal_memo", label: "Internal Memo" },
      { id: "circular", label: "Circular" },
      { id: "company_announcement", label: "Company Announcement" },
      { id: "policy_update_notice", label: "Policy Update Notice" },
      { id: "holiday_notice", label: "Holiday Notice" }
    ]
  }
];

export const DEFAULT_TEMPLATES: Record<string, string> = {
  // Recruitment
  offer_letter: "Please review the terms of this offer. To accept this offer, please sign and return a copy of this letter on or before the offer validity date. We look forward to welcoming you to our team.",
  conditional_offer_letter: "We are pleased to offer you employment on a conditional basis. This offer is contingent upon the successful completion of background checks, reference checks, and verification of your academic and professional credentials.\n\nPlease review the terms and return a signed copy of this letter to confirm your acceptance of these conditions.",
  internship_offer_letter: "We are delighted to offer you an internship opportunity. This program is designed to provide you with valuable hands-on experience, professional mentorship, and practical training in your field of study.\n\nYour internship will be for a duration of 3 (three) months. We look forward to your contributions and wish you a highly productive learning experience with us.",
  appointment_letter: "With reference to your application and subsequent interview, we are pleased to appoint you to the position. This appointment is effective from your date of joining, subject to the terms and conditions outlined in the official employment agreement.\n\nPlease sign and return the duplicate copy of this letter as token of your acceptance of the terms.",
  joining_letter: "This letter officially confirms that you have successfully joined the company and completed all onboarding, IT configuration, and HR registration formalities on your scheduled joining date. We warmly welcome you to the team and look forward to achieving great milestones together.",
  candidate_rejection_letter: "Thank you very much for taking the time to interview with us. We were highly impressed by your qualifications and professional background.\n\nHowever, after careful consideration of all applicants, we have decided to proceed with another candidate whose experience matches our current requirements more closely. We will keep your profile on record for future openings.",
  interview_invitation: "We are pleased to invite you for an interview to discuss your application. This round will focus on your technical expertise, past experience, and cultural alignment with our team.\n\nPlease confirm your availability for the scheduled time, and let us know if you require any specific arrangements.",
  interview_result_letter: "We are pleased to inform you that you have successfully cleared the recent round of interviews. The selection panel found your profile and performance highly satisfactory.\n\nOur HR team will contact you shortly to discuss the next steps in the recruitment process.",

  // Employment
  employment_agreement: "1. Probation\nThe Employee shall serve a probation period of {probation_period} months from the date of joining. Either party may terminate employment during this period with 7 (seven) days' written notice.\n\n2. Working Hours\nStandard working hours are 9:00 AM to 6:00 PM, Sunday through Thursday, with a 1-hour lunch break. The Employee may be required to work additional hours as business needs demand.\n\n3. Confidentiality\nThe Employee shall maintain strict confidentiality regarding all proprietary information, client data, business strategies and any non-public information of the Company, both during and after the term of employment.\n\n4. Intellectual Property\nAll work product, inventions, software and creative works produced by the Employee during the course of employment shall be the exclusive property of the Company.",
  nda: "During the course of your employment, you will have access to confidential, proprietary, and trade secret information belonging to the Company. By signing this agreement, you agree to keep all such information strictly confidential and not disclose it to any third party during or after your employment.\n\nAny unauthorized disclosure will result in immediate disciplinary action up to termination, and legal action if necessary.",
  non_compete_agreement: "To protect the Company's legitimate business interests, the Employee agrees that during their employment and for a period of 12 (twelve) months following separation, they will not directly or indirectly engage in, perform services for, or establish a competing business in the same industry.\n\nThis restriction is limited to the geographic regions where the Company actively operates.",
  code_of_conduct_acknowledgement: "I hereby acknowledge that I have received, read, and fully understood the Company's Code of Conduct policy. I agree to abide by all the guidelines, values, and ethical standards described therein.\n\nI understand that compliance with these policies is a condition of my continued employment.",
  it_asset_agreement: "The Employee acknowledges receipt of company IT assets (including laptop, accessories, and security hardware). The Employee agrees to keep these assets secure, use them solely for official business purposes, and return them immediately upon separation in good working condition.",
  remote_work_agreement: "This agreement outlines the terms of your remote working arrangement. The Employee agrees to maintain a dedicated work area, adhere to standard working hours, remain accessible during office hours, and meet all productivity benchmarks as set by the supervisor.",
  probation_agreement: "The Employee's performance will be monitored and evaluated during a probation period of 3 (three) months. The Company reserves the right to extend the probation period or terminate employment at any time during this period if performance or conduct is found unsatisfactory.",
  employee_handbook_acknowledgement: "I acknowledge that I have received a copy of the Employee Handbook. I understand it is my responsibility to read, understand, and comply with all policies and procedures outlined in the handbook.",
  bank_account_request_letter: "This is to request the bank to open a salary account for our employee. The Company confirms their active employment and requests the bank to provide standard corporate salary account benefits to the holder.",
  id_card_request_letter: "This is to request the Admin department to issue an official company ID card and access badge for the employee. Please ensure all access permissions corresponding to their designation and department are enabled.",

  // Salary & Payroll
  payslip: "This payslip provides the breakdown of your salary earnings and deductions for the current pay period.",
  salary_certificate: "This is to certify that {employee_name} is actively employed with our company. Their designation is as specified and their gross monthly salary is credited directly to their bank account on record.\n\nThis certificate is issued upon the employee's request for verification purposes.",
  salary_increment_letter: "In recognition of your exceptional performance, dedication, and valuable contributions to the Company over the past year, we are pleased to revise your salary package upwards.\n\nYour updated gross compensation will be effective from the next payroll cycle. Thank you for your hard work and commitment.",
  bonus_letter: "We are pleased to inform you that you have been awarded a performance bonus in recognition of your outstanding work and successful completion of recent business goals.\n\nThis one-time bonus will be credited with your upcoming salary. We appreciate your dedication to the Company's success.",
  commission_letter: "This letter outlines your commission structure and payouts based on sales targets achieved. Payouts will be processed monthly in accordance with target completion reports verified by your department head.",
  incentive_letter: "We are pleased to inform you that you have qualified for the quarterly performance incentive program due to your excellent achievements. This incentive is a token of appreciation for exceeding your team targets.",
  payroll_summary: "This document provides the official payroll summary, breakdown of hours, earnings, deductions, and net payouts processed for the employee for the specified pay period.",
  income_certificate: "This is to certify that the employee's total taxable income for the current financial year has been processed. The gross earnings, tax deductions, and net salary credit details are as per our payroll records.",
  tax_certificate: "This tax certificate verifies the total income earned and tax deducted at source (TDS) for the employee during the assessment period, fully filed with the tax authorities.",

  // Attendance & Leave
  leave_approval_letter: "We are pleased to inform you that your request for leave has been officially approved. Please ensure a proper handover of your active tasks is completed before your leave starts.",
  leave_rejection_letter: "We regret to inform you that your leave request has been declined at this time due to operational requirements and critical project deadlines. We appreciate your understanding and encourage rescheduling for a later date.",
  maternity_leave_letter: "This letter confirms the approval of your maternity leave request. The company wishes you the best and looks forward to your safe return to work at the completion of your leave period.",
  paternity_leave_letter: "This letter confirms the approval of your paternity leave request. The company congratulates you on the new addition to your family.",
  unpaid_leave_letter: "Your request for unpaid leave of absence has been approved under the terms discussed with HR. Please note that no salary credits will accrue during this specific period.",
  work_from_home_approval: "We are pleased to approve your request to work from home. Please ensure you remain reachable via communication channels and maintain standard daily deliverables.",
  attendance_certificate: "This certificate verifies the official attendance logs, shift timings, and total active working days recorded for the employee during their tenure.",

  // Performance
  probation_evaluation: "This document outlines the performance evaluation and feedback completed during the employee's probation period. Specific goals, strengths, and areas requiring improvement have been noted.",
  probation_confirmation_letter: "We are pleased to inform you that you have successfully completed your probation period. Your performance and conduct have met our standards, and we are happy to confirm your employment as a permanent member of our team.",
  warning_letter: "This is an official warning letter regarding performance or conduct issues. You are advised to take immediate corrective actions to align with company expectations. Failure to do so will result in further disciplinary action.",
  show_cause_notice: "You are hereby requested to explain in writing within 48 hours of receipt of this notice why disciplinary action should not be initiated against you for the reported policy violation.",
  pip: "This Performance Improvement Plan (PIP) is designed to help you meet the performance expectations of your role. Over the next 30 days, your progress will be closely monitored and reviewed weekly.",
  appreciation_letter: "We would like to express our sincere appreciation for your outstanding efforts, dedication, and recent contributions to the project. Your hard work has played a vital role in our success.",
  employee_recognition_certificate: "This certificate is awarded in recognition of outstanding performance, professionalism, and exemplary dedication shown towards achieving company goals.",
  promotion_letter: "All other terms and conditions of your employment contract remain unchanged. We would like to take this opportunity to thank you for your excellent work and wish you continued success in your new role.",
  department_transfer_letter: "This is to notify you that you are being officially transferred to the new department. Your designation, reporting manager, and key responsibilities will be updated in accordance with the new role.",
  role_change_letter: "This letter confirms your transition to a new role within the company. We are confident that your skills and experience will bring great value to this new set of responsibilities.",
  salary_revision_letter: "This letter serves as notification of a revision in your salary package. The updated breakdown of allowances and gross salary will take effect from the specified date.",

  // HR Requests
  noc: "This is to certify that the Company has no objection to {employee_name} pursuing higher education, professional training, or personal travel as requested, without affecting their active duties.",
  employment_verification_letter: "This is to verify that {employee_name} (Employee Code: {employee_code}) is currently employed with us as {designation} in the {department} department.\n\nThis letter is issued upon the request of the employee for verification purposes.",
  visa_employment_letter: "This letter is issued to support the employee's visa application. We confirm that {employee_name} is actively employed with us as {designation} in the {department} department. Their current gross salary is {new_salary} and their travel leave has been approved.",
  embassy_employment_letter: "This official letter is addressed to the Embassy to confirm that {employee_name} is actively employed with us as {designation}. We confirm that they will return to their duties upon completion of their approved travel.",
  bank_verification_letter: "This letter confirms the employment details, date of joining, and monthly salary credit of {employee_name} for bank account or credit facility verification.",
  address_verification_letter: "This is to confirm that the residential address of {employee_name} as per our official HR records is correct.",

  // Separation
  resignation_acceptance_letter: "We hereby accept your resignation from the position of {designation}. We thank you for your contributions during your tenure and wish you the very best in your future endeavors. Your last working day is confirmed as {relieving_date}.",
  experience_letter: "This is to certify that {employee_name} (Employee Code: {employee_code}) was employed with {company_name} as {designation} in the {department} department from {joining_date} to {relieving_date}.\n\nDuring their tenure, we found them to be sincere, hardworking and professional. Their conduct and performance throughout the period of service were satisfactory.\n\nWe wish them the very best in their future endeavours.",
  service_certificate: "This service certificate confirms that {employee_name} was employed with us. They carried out their responsibilities with professionalism and dedication throughout their service period.",
  relieving_letter: "This is to certify that {employee_name} (Employee Code: {employee_code}) was employed with {company_name} as {designation} in the {department} department from {joining_date} to {relieving_date}.\n\nThey have been duly relieved of all their duties and responsibilities with effect from {relieving_date}. All company dues have been settled.\n\nWe wish them the very best in their future endeavours.",
  full_final_settlement_letter: "This document provides the final settlement of accounts, outstanding dues, encashments, and deductions processed for {employee_name} upon their separation from the company.",
  exit_clearance_letter: "This letter confirms that {employee_name} has completed all departmental handovers, returned all company properties (IT assets, access cards, files), and cleared all dues.",
  exit_interview_form: "This form captures feedback and inputs from {employee_name} during their exit interview to help us improve our workplace culture and processes.",
  termination_letter: "Please return all company properties, including your employee ID, laptop, and office keys, on or before your last working day. Any accrued vacation time and final wages will be calculated and paid out in accordance with state laws.\n\nWe thank you for the service you have provided during your tenure and wish you the best in your future endeavors.",
  contract_completion_letter: "This letter marks the successful completion of your contract period with our company. We thank you for your valuable services and dedication during the contract term.",

  // Legal & Compliance
  disciplinary_notice: "This formal notice is issued regarding a policy breach. You are required to submit an explanation to the HR department regarding the incident.",
  suspension_letter: "You are placed under suspension pending an inquiry into the allegations of misconduct. During this period, you are requested not to enter the office premises without prior permission.",
  warning_notice: "This is a formal warning notice regarding violation of company policy. Please ensure immediate compliance with all guidelines to avoid disciplinary procedures.",
  final_warning_letter: "This is a final warning notice. Any further violation of company policies or failure to meet performance standards will result in immediate termination of employment.",
  policy_violation_notice: "This notice details the specific policy violation observed. You are requested to review the company handbook and sign the corrective action plan.",
  confidentiality_reminder: "As a reminder of your employment terms, you are bound by confidentiality guidelines. Please ensure no proprietary data or project details are shared outside the organization.",
  legal_notice: "This official legal notice is served regarding the breach of contract terms. You are required to respond to our legal representative within the specified timeline.",

  // Assets
  asset_issue_form: "This form records the details, serial numbers, and condition of company assets issued to the employee for official business use.",
  asset_return_form: "This form records the return and physical condition inspection of company assets handed back by the employee upon separation or upgrade.",
  laptop_handover: "This handover document confirms receipt and configuration of the company laptop, including operating software and security access tools.",
  sim_card_handover: "This document records the assignment of the corporate SIM card and mobile number to the employee for business communications.",
  access_card_handover: "This document records the issuance of the office entry access card. The employee agrees to report any loss of the card immediately.",
  asset_damage_report: "This report documents the damage to company property, the assessment of repair costs, and whether the damage was accidental or due to negligence.",

  // Training
  training_invitation: "You are invited to attend the upcoming professional training session. This program is aimed at enhancing your technical skills and performance in your role.",
  training_completion_certificate: "This certificate is awarded to the employee for successful completion and active participation in the training program.",
  training_attendance_certificate: "This certificate verifies attendance and participation in the specialized training workshop conducted by the company.",
  skill_assessment_report: "This report summarizes the feedback and results of your recent skill assessment. It highlights key strengths and areas identified for professional development.",

  // Internal Documents
  internal_memo: "This internal memo is to communicate important guidelines regarding office decorum, security practices, and daily operations to all team members.",
  circular: "This circular is distributed to notify all staff members of the upcoming changes in shift timings, holiday list, or policy guidelines.",
  company_announcement: "We are pleased to announce the successful achievement of our business goals, new client sign-ups, or organizational updates to the entire team.",
  policy_update_notice: "This notice outlines the updates made to our company policies. All employees are requested to review the updated guidelines in the employee portal.",
  holiday_notice: "Please be informed that the office will remain closed on the upcoming public holiday. We wish everyone a safe and happy holiday."
};

interface Employee {
    id: number;
    employee_id_code: string;
    name: string;
    email: string;
    designation: string;
    department: string;
    basic_salary: number;
    date_of_joining: string;
    employment_type?: string;
    branch?: string;
    work_mode?: string;
    work_location_country?: string;
    work_location?: string;
    bank_name?: string;
    account_holder_name?: string;
    account_number?: string;
    bank_identifier_code?: string;
    bank_branch?: string;
    bank_country?: string;
    bank_notes?: string;
    tax_payer_id?: string;
}

interface IndexProps {
    employees: Employee[];
    companySettings: Record<string, string>;
    prefill?: {
        employee_id?: string | number;
        document_type?: string;
        payload?: any;
        issued_date?: string;
    };
}

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
    newSalary: string
) => {
    if (!templateText) return '';
    if (!employee) return templateText;

    return templateText
        .replace(/{employee_name}/g, employee.name)
        .replace(/{employee_code}/g, employee.employee_id_code)
        .replace(/{designation}/g, activeDesignation)
        .replace(/{department}/g, activeDepartment)
        .replace(/{company_name}/g, companyName)
        .replace(/{joining_date}/g, joiningDate)
        .replace(/{relieving_date}/g, relievingDate)
        .replace(/{probation_period}/g, probationPeriod)
        .replace(/{new_designation}/g, newDesignation || '[New Designation]')
        .replace(/{new_salary}/g, newSalary || '[New Salary]');
};

export const getDocumentName = (type: string): string => {
    if (!type) return '';
    for (const cat of DOCUMENT_CATEGORIES) {
        const match = cat.types.find(t => t.id === type);
        if (match) {
            return match.label;
        }
    }
    switch (type) {
        case 'offer_letter':
            return 'Letter Of Offer';
        case 'employment_agreement':
            return 'Employment Agreement';
        case 'payslip':
            return 'Payslip';
        case 'experience_letter':
            return 'Experience Letter';
        case 'relieving_letter':
            return 'Relieving Letter';
        case 'promotion_letter':
            return 'Letter Of Promotion';
        case 'termination_letter':
            return 'Letter Of Termination';
        default:
            return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
};

export const getDocumentTitle = (type: string): string => {
    return getDocumentName(type).toUpperCase();
};

export default function Index({ employees, companySettings, prefill }: IndexProps) {
    const { t } = useTranslation();
    const printRef = useRef<HTMLDivElement>(null);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [documentType, setDocumentType] = useState<string>('offer_letter');
    const [issuedDate, setIssuedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Pre-fill from query parameters or controller prefill prop on load
    useEffect(() => {
        let finalDocType = 'offer_letter';
        let hasPayloadParagraph = false;

        if (prefill) {
            if (prefill.employee_id) {
                setSelectedEmployeeId(String(prefill.employee_id));
            }
            if (prefill.document_type) {
                setDocumentType(prefill.document_type);
                finalDocType = prefill.document_type;
            }
            if (prefill.issued_date) {
                setIssuedDate(prefill.issued_date);
            }
            if (prefill.payload) {
                const p = prefill.payload;
                if (p.customCompanyName !== undefined) setCustomCompanyName(p.customCompanyName || '');
                if (p.customParagraph !== undefined) {
                    setCustomParagraph(p.customParagraph || '');
                    hasPayloadParagraph = true;
                }
                if (p.expiryDate !== undefined) setExpiryDate(p.expiryDate || '');
                if (p.noticePeriod !== undefined) setNoticePeriod(p.noticePeriod || '30');
                if (p.probationPeriod !== undefined) setProbationPeriod(p.probationPeriod || '3');
                if (p.severanceAmount !== undefined) setSeveranceAmount(p.severanceAmount || '');
                if (p.workLocation !== undefined) setWorkLocation(p.workLocation || '');
                if (p.reportingTo !== undefined) setReportingTo(p.reportingTo || '');
                if (p.payPeriod !== undefined) setPayPeriod(p.payPeriod || '');
                if (p.hasSignature !== undefined) setHasSignature(p.hasSignature !== false);
                if (p.overrideDate !== undefined) setOverrideDate(p.overrideDate || '');
                if (p.overrideDesignation !== undefined) setOverrideDesignation(p.overrideDesignation || '');
                if (p.overrideDepartment !== undefined) setOverrideDepartment(p.overrideDepartment || '');
                if (p.overrideEmploymentType !== undefined) setOverrideEmploymentType(p.overrideEmploymentType || 'Full-Time');
                if (p.overrideJobType !== undefined) setOverrideJobType(p.overrideJobType || '-');
                if (p.typedSignatoryName !== undefined) setTypedSignatoryName(p.typedSignatoryName || '');
                if (p.signatureImage !== undefined) setSignatureImage(p.signatureImage || null);
                if (p.newDesignation !== undefined) setNewDesignation(p.newDesignation || '');
                if (p.newSalary !== undefined) setNewSalary(p.newSalary || '');
                if (p.promotionEffectiveDate !== undefined) setPromotionEffectiveDate(p.promotionEffectiveDate || '');
                if (p.terminationReason !== undefined) setTerminationReason(p.terminationReason || 'Performance Issues');
                if (p.terminationEffectiveDate !== undefined) setTerminationEffectiveDate(p.terminationEffectiveDate || '');
            }
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            const empId = urlParams.get('employee_id');
            const docType = urlParams.get('document_type');
            if (empId) {
                setSelectedEmployeeId(empId);
            }
            if (docType) {
                setDocumentType(docType);
                finalDocType = docType;
            }
        }

        // Prefill default template on load ONLY if not loaded from a saved payload
        if (!hasPayloadParagraph) {
            if (DEFAULT_TEMPLATES[finalDocType] !== undefined) {
                setCustomParagraph(DEFAULT_TEMPLATES[finalDocType]);
            }
        }
    }, [prefill]);

    // Override date
    const [overrideDate, setOverrideDate] = useState<string>('');

    // Dynamic fields (Quick-fill overrides)
    const [customCompanyName, setCustomCompanyName] = useState<string>('');
    const [customParagraph, setCustomParagraph] = useState<string>('');
    const [expiryDate, setExpiryDate] = useState<string>('');
    const [noticePeriod, setNoticePeriod] = useState<string>('30');
    const [probationPeriod, setProbationPeriod] = useState<string>('3');
    const [severanceAmount, setSeveranceAmount] = useState<string>('');
    const [workLocation, setWorkLocation] = useState<string>('');
    const [reportingTo, setReportingTo] = useState<string>('');
    const [newDesignation, setNewDesignation] = useState<string>('');
    const [newSalary, setNewSalary] = useState<string>('');
    const [promotionEffectiveDate, setPromotionEffectiveDate] = useState<string>('');
    const [terminationReason, setTerminationReason] = useState<string>('Performance Issues');
    const [terminationEffectiveDate, setTerminationEffectiveDate] = useState<string>('');
    
    // Quick-fill override fields
    const [overrideDesignation, setOverrideDesignation] = useState<string>('');
    const [overrideDepartment, setOverrideDepartment] = useState<string>('');
    const [overrideEmploymentType, setOverrideEmploymentType] = useState<string>('Full-Time');
    const [overrideJobType, setOverrideJobType] = useState<string>('-');

    // Authorised signatory options
    const [typedSignatoryName, setTypedSignatoryName] = useState<string>('');
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);

    const [payPeriod, setPayPeriod] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
    const [hasSignature, setHasSignature] = useState<boolean>(true);

    const currentEmployee = employees.find(emp => String(emp.id) === selectedEmployeeId);
    const isYearlySalary = currentEmployee?.salary_type === 'yearly';

    // Auto fill fields when employee changes
    useEffect(() => {
        if (currentEmployee) {
            setCustomCompanyName(companySettings.company_name || 'Dynime LLC.');
            setOverrideDesignation(currentEmployee.designation || '');
            setOverrideDepartment(currentEmployee.department || '');
            setWorkLocation(currentEmployee.branch || '');
            
            // Match values with database
            const empType = currentEmployee.employment_type || 'Full Time';
            setOverrideEmploymentType(empType);
            setOverrideJobType(empType);

            // ALSO resolve and set default template for the current documentType if not loaded from history
            const urlParams = new URLSearchParams(window.location.search);
            const hasPrefillPayload = prefill && prefill.payload && prefill.payload.customParagraph !== undefined;
            if (!hasPrefillPayload && DEFAULT_TEMPLATES[documentType] !== undefined) {
                const resolved = resolveTemplate(
                    DEFAULT_TEMPLATES[documentType],
                    currentEmployee,
                    currentEmployee.designation || '',
                    currentEmployee.department || '',
                    companySettings.company_name || 'Dynime LLC.',
                    formatDocumentDate(currentEmployee.date_of_joining || new Date().toISOString().split('T')[0]),
                    formatDocumentDate(issuedDate),
                    probationPeriod,
                    newDesignation,
                    newSalary
                );
                setCustomParagraph(resolved);
            }
        }
    }, [selectedEmployeeId, currentEmployee]);

    const handleDocumentTypeChange = (value: string) => {
        setDocumentType(value);
        if (DEFAULT_TEMPLATES[value] !== undefined) {
            const resolved = resolveTemplate(
                DEFAULT_TEMPLATES[value],
                currentEmployee,
                overrideDesignation || currentEmployee?.designation || '',
                overrideDepartment || currentEmployee?.department || '',
                customCompanyName || companySettings.company_name || 'Dynime LLC.',
                formatDocumentDate(overrideDate || currentEmployee?.date_of_joining || new Date().toISOString().split('T')[0]),
                formatDocumentDate(issuedDate),
                probationPeriod,
                newDesignation,
                newSalary
            );
            setCustomParagraph(resolved);
        } else {
            setCustomParagraph('');
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignatureImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePrint = () => {
        if (!selectedEmployeeId) return;

        const payload = {
            customCompanyName,
            customParagraph,
            expiryDate,
            noticePeriod,
            probationPeriod,
            severanceAmount,
            workLocation,
            reportingTo,
            payPeriod,
            hasSignature,
            overrideDate,
            overrideDesignation,
            overrideDepartment,
            overrideEmploymentType,
            overrideJobType,
            typedSignatoryName,
            signatureImage,
            newDesignation,
            newSalary,
            promotionEffectiveDate,
            terminationReason,
            terminationEffectiveDate
        };

        // First, save the document to the history database
        router.post(route('hrm.document-builder.store'), {
            employee_id: selectedEmployeeId,
            document_type: documentType,
            payload: payload,
            issued_date: issuedDate
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Trigger print dialog once saved successfully
                let shortType = 'DOC';
                switch (documentType) {
                    case 'offer_letter':
                        shortType = 'OL';
                        break;
                    case 'employment_agreement':
                        shortType = 'AP';
                        break;
                    case 'payslip':
                        shortType = 'PS';
                        break;
                    case 'experience_letter':
                        shortType = 'EL';
                        break;
                    case 'relieving_letter':
                        shortType = 'RL';
                        break;
                    case 'promotion_letter':
                        shortType = 'PL';
                        break;
                    case 'termination_letter':
                        shortType = 'TL';
                        break;
                }

                const empId = currentEmployee ? currentEmployee.employee_id_code : 'GUEST';
                const originalTitle = document.title;

                // Temporarily set document title which browsers use as default filename for "Print to PDF"
                document.title = `${shortType}-${empId}`;

                window.print();

                // Restore original page title
                setTimeout(() => {
                    document.title = originalTitle;
                }, 1000);
            }
        });
    };

    const handleAskSignature = () => {
        if (!selectedEmployeeId) return;

        const payload = {
            customCompanyName,
            customParagraph,
            expiryDate,
            noticePeriod,
            probationPeriod,
            severanceAmount,
            workLocation,
            reportingTo,
            payPeriod,
            hasSignature,
            overrideDate,
            overrideDesignation,
            overrideDepartment,
            overrideEmploymentType,
            overrideJobType,
            typedSignatoryName,
            signatureImage,
            newDesignation,
            newSalary,
            promotionEffectiveDate,
            terminationReason,
            terminationEffectiveDate
        };

        router.post(route('hrm.document-builder.store'), {
            employee_id: selectedEmployeeId,
            document_type: documentType,
            payload: payload,
            issued_date: issuedDate
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = page.props.flash as any;
                if (flash?.sign_link) {
                    navigator.clipboard.writeText(flash.sign_link);
                    toast.success(t('Document generated! Signing link copied to clipboard.'));
                } else {
                    toast.success(t('Document generated and sent for signature.'));
                }
            }
        });
    };

    const getDocumentTitle = () => {
        switch (documentType) {
            case 'offer_letter':
                return t('LETTER OF OFFER');
            case 'employment_agreement':
                return t('EMPLOYMENT AGREEMENT');
            case 'payslip':
                return t('PAYSLIP');
            case 'experience_letter':
                return t('EXPERIENCE LETTER');
            case 'relieving_letter':
                return t('RELIEVING LETTER');
            case 'promotion_letter':
                return t('LETTER OF PROMOTION');
            case 'termination_letter':
                return t('LETTER OF TERMINATION');
            default:
                // Find matching label from categories
                for (const cat of DOCUMENT_CATEGORIES) {
                    const match = cat.types.find(type => type.id === documentType);
                    if (match) {
                        return t(match.label.toUpperCase());
                    }
                }
                return t('DOCUMENT');
        }
    };

    const getTenureString = (joiningDateStr: string, releaseDateStr: string) => {
        try {
            const start = new Date(joiningDateStr);
            const end = new Date(releaseDateStr);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const months = Math.round(diffDays / 30);
            return `${months} months`;
        } catch (e) {
            return '9 months';
        }
    };

    const numberToWords = (num: number) => {
        if (num === 400) return 'Four Hundred only';
        return `${num} only`;
    };

    const activeDate = overrideDate || (currentEmployee ? currentEmployee.date_of_joining : issuedDate);
    const activeDesignation = overrideDesignation || (currentEmployee ? currentEmployee.designation : '');
    const activeDepartment = overrideDepartment || (currentEmployee ? currentEmployee.department : '');

    // Format date specifically as "DD MMM YYYY" (e.g. 01 Jan 2024)
    const formatDocumentDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const day = String(date.getDate()).padStart(2, '0');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            return `${day} ${month} ${year}`;
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('HRM'), href: route('hrm.index') }, { label: t('Document Builder') }]}
            pageTitle={t('HR Document Builder')}
        >
            <Head title={t('HR Document Builder')} />

            {/* Custom stylesheet injected for perfect print layout & handwriting cursive font */}
            <style dangerouslySetInnerHTML={{ __html: `
                @font-face {
                    font-family: 'Autography';
                    src: url('/fonts/Autography.otf') format('opentype');
                }
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Playpen+Sans:wght@400;600&family=Alex+Brush&family=Mr+De+Haviland&family=Allura&display=swap');
                @page {
                    size: auto;
                    margin: 0mm !important;
                }
                @media print {
                    html, body {
                        margin: 0;
                        padding: 0;
                        background: #ffffff;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-document, #printable-document * {
                        visibility: visible;
                    }
                    #printable-document {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        min-height: auto !important;
                        height: auto !important;
                        margin: 0;
                        padding: 36px 36px 36px 36px !important;
                        box-shadow: none;
                        border: none;
                        background: #ffffff;
                        display: block !important;
                    }
                }
            `}} />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* Configuration Controls Panel (Left Panel) */}
                <div className="xl:col-span-5 space-y-6 print:hidden">
                    <Card className="border border-gray-200 shadow-sm rounded-xl">
                        <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-md font-semibold text-gray-900">{t('Document Configurations')}</h3>
                            <p className="text-xs text-gray-500">{t('Fill details to dynamically compile employee documents')}</p>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            
                            {/* Employee Selector */}
                            <div className="space-y-1.5">
                                <Label htmlFor="employee-select">{t('Select Employee')}</Label>
                                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                    <SelectTrigger id="employee-select" className="w-full">
                                        <SelectValue placeholder={t('Choose an employee...')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={String(emp.id)}>
                                                {emp.name} ({emp.employee_id_code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Document Type Selector */}
                            <div className="space-y-1.5">
                                <Label htmlFor="doc-type-select">{t('Document Type')}</Label>
                                <Select value={documentType} onValueChange={handleDocumentTypeChange}>
                                    <SelectTrigger id="doc-type-select" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        {DOCUMENT_CATEGORIES.map(category => [
                                            <SelectItem 
                                                key={`header_${category.name}`} 
                                                value={`header_${category.name}`} 
                                                disabled 
                                                className="font-bold text-primary bg-muted/40 text-xs py-1.5 border-y select-none"
                                            >
                                                📂 {category.name.toUpperCase()}
                                            </SelectItem>,
                                            ...category.types.map(type => (
                                                <SelectItem key={type.id} value={type.id} className="pl-6 text-xs">
                                                    {type.label}
                                                </SelectItem>
                                            ))
                                        ])}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Re-issue / Override date */}
                            <div className="space-y-1.5">
                                <Label htmlFor="override-date">{t('Re-issue / override date (Optional)')}</Label>
                                <Input
                                    id="override-date"
                                    type="date"
                                    value={overrideDate}
                                    onChange={(e) => setOverrideDate(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    {t("Effective date is taken from the employee's joining date automatically. Set this only when back-dating or re-issuing.")}
                                </p>
                            </div>

                            {/* Custom Company Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="company-name-input">{t('Custom company name (Optional)')}</Label>
                                <Input
                                    id="company-name-input"
                                    placeholder="e.g. Dynime LLC"
                                    value={customCompanyName}
                                    onChange={(e) => setCustomCompanyName(e.target.value)}
                                />
                            </div>

                            {/* Conditional Inputs based on document type */}
                            {documentType === 'offer_letter' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="offer-expiry">{t('Offer valid until')}</Label>
                                    <Input
                                        id="offer-expiry"
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                    />
                                </div>
                            )}

                            {documentType === 'promotion_letter' && (
                                <div className="space-y-4 border border-blue-100 bg-blue-50/30 rounded-xl p-3.5">
                                    <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">{t('Promotion Details')}</div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="new-designation">{t('New Designation')}</Label>
                                            <Input
                                                id="new-designation"
                                                placeholder={t('e.g. Senior Operations Manager')}
                                                value={newDesignation}
                                                onChange={(e) => setNewDesignation(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="new-salary">{isYearlySalary ? t('New Gross Salary ($ / year)') : t('New Gross Salary ($ / month)')}</Label>
                                            <Input
                                                id="new-salary"
                                                type="number"
                                                placeholder={isYearlySalary ? t('e.g. 36000') : t('e.g. 3000')}
                                                value={newSalary}
                                                onChange={(e) => setNewSalary(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="promotion-date">{t('Effective Date')}</Label>
                                            <Input
                                                id="promotion-date"
                                                type="date"
                                                value={promotionEffectiveDate}
                                                onChange={(e) => setPromotionEffectiveDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {documentType === 'termination_letter' && (
                                <div className="space-y-4 border border-red-100 bg-red-50/30 rounded-xl p-3.5">
                                    <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">{t('Termination Details')}</div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="termination-reason">{t('Reason for Termination')}</Label>
                                            <Input
                                                id="termination-reason"
                                                placeholder={t('e.g. Redundancy / Business Restructuring')}
                                                value={terminationReason}
                                                onChange={(e) => setTerminationReason(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="termination-date">{t('Termination Effective Date')}</Label>
                                            <Input
                                                id="termination-date"
                                                type="date"
                                                value={terminationEffectiveDate}
                                                onChange={(e) => setTerminationEffectiveDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="severance-pay">{t('Severance Pay ($)')}</Label>
                                            <Input
                                                id="severance-pay"
                                                type="number"
                                                placeholder={t('e.g. 1500')}
                                                value={severanceAmount}
                                                onChange={(e) => setSeveranceAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick-fill missing fields accordion/section */}
                            <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                                <div className="font-semibold text-xs uppercase tracking-wider text-gray-500">
                                    {t('Quick-fill missing fields')} <span className="text-[9px] lowercase font-normal">({t('overrides this document only')})</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="override-designation">{t('Designation')}</Label>
                                        <Input
                                            id="override-designation"
                                            value={overrideDesignation}
                                            onChange={(e) => setOverrideDesignation(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="override-department">{t('Department')}</Label>
                                        <Input
                                            id="override-department"
                                            value={overrideDepartment}
                                            onChange={(e) => setOverrideDepartment(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="override-employment-type">{t('Employment type')}</Label>
                                        <Select value={overrideEmploymentType} onValueChange={setOverrideEmploymentType}>
                                            <SelectTrigger id="override-employment-type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Full Time">{t('Full Time')}</SelectItem>
                                                <SelectItem value="Part Time">{t('Part Time')}</SelectItem>
                                                <SelectItem value="Contract">{t('Contract')}</SelectItem>
                                                <SelectItem value="Internship">{t('Internship')}</SelectItem>
                                                <SelectItem value="Temporary">{t('Temporary')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="override-job-type">{t('Job type')}</Label>
                                        <Input
                                            id="override-job-type"
                                            value={overrideJobType}
                                            onChange={(e) => setOverrideJobType(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="work-location">{t('Work location')}</Label>
                                        <Input
                                            id="work-location"
                                            value={workLocation}
                                            onChange={(e) => setWorkLocation(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reporting-to">{t('Reporting to')}</Label>
                                        <Input
                                            id="reporting-to"
                                            value={reportingTo}
                                            onChange={(e) => setReportingTo(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Custom Paragraph */}
                            <div className="space-y-1.5">
                                <Label htmlFor="custom-notes">
                                    {!['offer_letter', 'employment_agreement', 'payslip', 'experience_letter', 'relieving_letter', 'promotion_letter', 'termination_letter'].includes(documentType) 
                                        ? t('Document Body Content') 
                                        : t('Custom paragraph (optional, appended to the body)')
                                    }
                                </Label>
                                <Textarea
                                    id="custom-notes"
                                    placeholder={!['offer_letter', 'employment_agreement', 'payslip', 'experience_letter', 'relieving_letter', 'promotion_letter', 'termination_letter'].includes(documentType)
                                        ? t('Type the official content/body of the document here...')
                                        : t('Add any extra context, benefits, or notes...')
                                    }
                                    rows={!['offer_letter', 'employment_agreement', 'payslip', 'experience_letter', 'relieving_letter', 'promotion_letter', 'termination_letter'].includes(documentType) ? 8 : 4}
                                    value={customParagraph}
                                    onChange={(e) => setCustomParagraph(e.target.value)}
                                />
                            </div>

                            {/* Authorised signature settings section */}
                            <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                                <div className="font-semibold text-xs uppercase tracking-wider text-gray-500">
                                    {t('Authorised signature (optional)')}
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    {t("Upload an official signature image. Leave blank to show the default system-generated placeholder.")}
                                </p>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="signature-upload">{t('Upload signature image (PNG with transparent background works best)')}</Label>
                                        <Input
                                            id="signature-upload"
                                            type="file"
                                            ref={signatureInputRef}
                                            accept="image/png, image/jpeg"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                    {signatureImage && (
                                        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100 mt-2">
                                            <div className="h-10 w-20 bg-white border rounded flex items-center justify-center overflow-hidden p-1">
                                                <img src={signatureImage} alt="Signature preview" className="h-full object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-gray-500 font-medium truncate">{t('Uploaded signature image')}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 text-xs px-2 font-bold shrink-0"
                                                onClick={() => {
                                                    setSignatureImage(null);
                                                    if (signatureInputRef.current) {
                                                        signatureInputRef.current.value = '';
                                                    }
                                                }}
                                            >
                                                {t('Remove')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    onClick={handlePrint}
                                    disabled={!selectedEmployeeId}
                                    variant="outline"
                                    className="flex items-center justify-center gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                                >
                                    <Printer className="h-4 w-4" />
                                    {t('Print / PDF')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleAskSignature}
                                    disabled={!selectedEmployeeId}
                                    className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                                >
                                    <PenTool className="h-4 w-4" />
                                    {t('Ask signature')}
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* Real-time A4 Preview Panel (Right Panel) - Exactly matching user PDF layout */}
                <div className="xl:col-span-7 flex justify-center">
                    {currentEmployee ? (
                        <div
                            id="printable-document"
                            ref={printRef}
                            className="bg-white w-[794px] min-h-[1123px] pt-[50px] pb-[50px] px-[36px] border border-[#e5e5ea] shadow-md relative flex flex-col justify-between font-sans text-[#1c1c1e] text-[13px] leading-relaxed rounded-lg"
                        >
                            {/* Document Header */}
                            <div>
                                <div className="flex items-start justify-between border-b border-[#e5e5ea] pb-4 mb-8">
                                    <div className="flex items-center gap-4">
                                        {/* Official Dynime Logo Image */}
                                        <img src="/logo_dynime.png" alt="Dynime" className="h-10 object-contain" />
                                        <div className="border-l border-[#e5e5ea] pl-4">
                                            <h2 className="font-bold text-[#1c1c1e] text-sm tracking-wide">{customCompanyName || 'Dynime LLC.'}</h2>
                                            <p className="text-[10px] text-[#8e8e93] mt-1 flex items-center gap-2">
                                                <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_email || 'contact@dynime.com'}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Globe className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_website || 'dynime.com'}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_telephone || '+16468840271'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="font-bold text-[#1c1c1e] text-sm uppercase tracking-wider">{getDocumentTitle()}</h3>
                                        <div className="text-[11px] text-[#787880] mt-1">
                                            {documentType === 'offer_letter' && (
                                                <p>{t('Joining Date')}: <strong>{formatDocumentDate(activeDate)}</strong></p>
                                            )}
                                            {documentType === 'employment_agreement' && (
                                                <p>{t('Joining Date')}: <strong>{formatDocumentDate(activeDate)}</strong></p>
                                            )}
                                            {documentType === 'payslip' && (
                                                <div className="space-y-0.5">
                                                    <p>{t('Issued')}: <strong>{formatDocumentDate(issuedDate)}</strong></p>
                                                    <p>{t('Period')}: <strong>{new Date(payPeriod + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</strong></p>
                                                </div>
                                            )}
                                            {(documentType === 'experience_letter' || documentType === 'relieving_letter') && (
                                                <p>{t('Issued')}: <strong>{formatDocumentDate(issuedDate)}</strong></p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Subject Details / Recipient info */}
                                <div className="mb-6">
                                    <h4 className="font-bold text-[#1c1c1e] text-sm">{currentEmployee.name}</h4>
                                    <p className="text-[#787880] text-[12px]">{activeDesignation}</p>
                                    {activeDepartment && <p className="text-[#787880] text-[12px]">{activeDepartment}</p>}
                                    <p className="text-[#787880] text-[12px]">{currentEmployee.email}</p>
                                    {workLocation && <p className="text-[#787880] text-[12px]">{workLocation}</p>}
                                </div>

                                {/* Main Letter / Document Content */}
                                <div className="space-y-5 text-[#1c1c1e] leading-relaxed text-[13px]">
                                    
                                    {/* OFFER LETTER */}
                                    {documentType === 'offer_letter' && (
                                        <div className="space-y-4">
                                            <p className="font-bold text-[#1c1c1e] text-sm">Dear {currentEmployee.name.split(' ')[0]},</p>
                                            <p>
                                                We are delighted to offer you the position of <strong className="text-[#1c1c1e]">{activeDesignation}</strong> in the <strong className="text-[#1c1c1e]">{activeDepartment}</strong> department at <strong className="text-[#1c1c1e]">{customCompanyName}</strong>. This letter sets out the principal terms of your employment.
                                            </p>
                                            
                                            {/* Details Box */}
                                            <div className="border border-[#e5e5ea] rounded-xl p-5 text-[12px]">
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                    <div><span className="text-[#8e8e93]">{t('Designation')}:</span> <strong className="text-[#1c1c1e]">{activeDesignation}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Department')}:</span> <strong className="text-[#1c1c1e]">{activeDepartment}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Employment type')}:</span> <strong className="text-[#1c1c1e]">{overrideEmploymentType}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Job type')}:</span> <strong className="text-[#1c1c1e]">{overrideJobType}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Work location')}:</span> <strong className="text-[#1c1c1e]">{workLocation || '—'}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Joining date')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Reporting to')}:</span> <strong className="text-[#1c1c1e]">{reportingTo || '—'}</strong></div>
                                                </div>
                                                <div className="mt-3 border-t border-[#e5e5ea] pt-3">
                                                    <span className="text-[#8e8e93]">{t('Gross compensation')}:</span> <strong className="text-[#1c1c1e]">{formatCurrency(currentEmployee.basic_salary)} {isYearlySalary ? t('/ year') : t('/ month')}</strong>
                                                </div>
                                            </div>

                                            {/* Earnings and Deductions tables side-by-side */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('EARNINGS (YEARLY)') : t('EARNINGS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[#787880]">{t('Basic salary')}</span>
                                                            <span className="font-semibold text-[#1c1c1e]">{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                        <div className="text-[#8e8e93] italic text-[11px]">
                                                            {t('N/A - no allowances configured')}
                                                        </div>
                                                        <div className="flex justify-between items-center border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e] mt-4">
                                                            <span>{t('Gross (CTC)')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('DEDUCTIONS (YEARLY)') : t('DEDUCTIONS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs flex flex-col justify-between h-[104px]">
                                                        <div className="text-[#8e8e93] italic text-[11px]">
                                                            {t('N/A - no deductions configured')}
                                                        </div>
                                                        <div className="flex justify-between items-center border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e]">
                                                            <span>{t('Net take-home')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* EMPLOYMENT AGREEMENT */}
                                    {documentType === 'employment_agreement' && (
                                        <div className="space-y-4">
                                            <p>
                                                This Employment Agreement (the "Agreement") is entered into on {formatDocumentDate(activeDate)} between <strong className="text-[#1c1c1e]">{customCompanyName}</strong> (the "Company") and <strong className="text-[#1c1c1e]">{currentEmployee.name}</strong> (the "Employee").
                                            </p>
                                            
                                            {/* Details Box */}
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 border border-[#e5e5ea] rounded-xl p-5 text-[12px]">
                                                <div><span className="text-[#8e8e93]">{t('Designation')}:</span> <strong className="text-[#1c1c1e]">{activeDesignation}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Joining date')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Employment type')}:</span> <strong className="text-[#1c1c1e]">{overrideEmploymentType}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Job type')}:</span> <strong className="text-[#1c1c1e]">{overrideJobType}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Work location')}:</span> <strong className="text-[#1c1c1e]">{workLocation || '—'}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Gross salary')}:</span> <strong className="text-[#1c1c1e]">{formatCurrency(currentEmployee.basic_salary)} {isYearlySalary ? t('/ year') : t('/ month')}</strong></div>
                                            </div>

                                            {/* Earnings and Deductions tables side-by-side */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('EARNINGS (YEARLY)') : t('EARNINGS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs">
                                                        <div className="flex justify-between font-semibold text-[#1c1c1e]">
                                                            <span>{t('Basic salary')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                        <div className="text-[#8e8e93] italic">
                                                            {t('N/A - no allowances configured')}
                                                        </div>
                                                        <div className="flex justify-between border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e]">
                                                            <span>{t('Gross (CTC)')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{isYearlySalary ? t('DEDUCTIONS (YEARLY)') : t('DEDUCTIONS (MONTHLY)')}</div>
                                                    <div className="p-4 space-y-2 text-xs flex flex-col justify-between h-[104px]">
                                                        <div className="text-[#8e8e93] italic">
                                                            {t('N/A - no deductions configured')}
                                                        </div>
                                                        <div className="flex justify-between border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e]">
                                                            <span>{t('Net take-home')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Agreement terms (Editable body content) */}
                                            {customParagraph && (
                                                <div className="mt-4 text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                                    {customParagraph}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* PAYSLIP */}
                                    {documentType === 'payslip' && (
                                        <div className="space-y-4">
                                            {/* Employee details grid */}
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 border border-[#e5e5ea] rounded-xl p-5 text-[12px]">
                                                <div><span className="text-[#8e8e93]">{t('Employee')}:</span> <strong className="text-[#1c1c1e]">{currentEmployee.name}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Employee Code')}:</span> <strong className="text-[#1c1c1e]">{currentEmployee.employee_id_code}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Designation')}:</span> <strong className="text-[#1c1c1e]">{activeDesignation}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Department')}:</span> <strong className="text-[#1c1c1e]">{activeDepartment}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Job type')}:</span> <strong className="text-[#1c1c1e]">{overrideJobType}</strong></div>
                                                <div><span className="text-[#8e8e93]">{t('Joining date')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong></div>
                                                <div className="col-span-2 mt-1 border-t border-[#e5e5ea] pt-2"><span className="text-[#8e8e93]">{t('Pay period')}:</span> <strong className="text-[#1c1c1e]">{new Date(payPeriod + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong></div>
                                            </div>

                                            {/* Earnings and Deductions tables side-by-side */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{t('EARNINGS')}</div>
                                                    <div className="p-4 space-y-2 text-xs">
                                                        <div className="flex justify-between font-semibold text-[#1c1c1e]">
                                                            <span>{t('Basic Salary')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e] mt-6">
                                                            <span>{t('Gross Earnings')}</span>
                                                            <span>{formatCurrency(currentEmployee.basic_salary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border border-[#e5e5ea] rounded-xl overflow-hidden">
                                                    <div className="bg-[#f4f4f5] border-b border-[#e5e5ea] px-4 py-2 font-semibold text-[#1c1c1e] text-xs uppercase tracking-wider">{t('DEDUCTIONS')}</div>
                                                    <div className="p-4 space-y-2 text-xs flex flex-col justify-between h-[104px]">
                                                        <div className="text-[#8e8e93] italic">
                                                            {t('No deductions')}
                                                        </div>
                                                        <div className="flex justify-between border-t border-[#e5e5ea] pt-2 font-bold text-[#1c1c1e]">
                                                            <span>{t('Total Deductions')}</span>
                                                            <span>$0.00</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Net Pay Box */}
                                            <div className="border-2 border-[#1c1c1e] rounded-xl p-4 flex justify-between items-center bg-white text-[#1c1c1e]">
                                                <div>
                                                    <span className="font-bold uppercase tracking-wider text-[10px] text-[#8e8e93] block">{t('NET PAY')}</span>
                                                    <span className="text-[11px] text-[#787880] italic">{numberToWords(currentEmployee.basic_salary)}</span>
                                                </div>
                                                <span className="text-2xl font-extrabold">{formatCurrency(currentEmployee.basic_salary)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* EXPERIENCE LETTER */}
                                    {documentType === 'experience_letter' && (
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-center text-sm uppercase tracking-wider border-b border-[#e5e5ea] pb-2 mb-4">{t('TO WHOM IT MAY CONCERN')}</h3>
                                            <div className="text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                                {customParagraph}
                                            </div>
                                        </div>
                                    )}

                                    {/* RELIEVING LETTER */}
                                    {documentType === 'relieving_letter' && (
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-center text-sm uppercase tracking-wider border-b border-[#e5e5ea] pb-2 mb-4">{t('TO WHOM IT MAY CONCERN')}</h3>
                                            <div className="text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                                {customParagraph}
                                            </div>
                                        </div>
                                    )}

                                    {/* PROMOTION LETTER */}
                                    {documentType === 'promotion_letter' && (
                                        <div className="space-y-4">
                                            <p className="font-bold text-[#1c1c1e] text-sm">Dear {currentEmployee.name.split(' ')[0]},</p>
                                            <p>
                                                We are extremely pleased to inform you that you have been promoted to the position of <strong className="text-[#1c1c1e]">{newDesignation || t('[New Designation]')}</strong> in recognition of your outstanding performance, dedication, and contributions to <strong className="text-[#1c1c1e]">{customCompanyName}</strong>.
                                            </p>
                                            <p>
                                                This promotion will be effective from <strong className="text-[#1c1c1e]">{promotionEffectiveDate ? formatDocumentDate(promotionEffectiveDate) : formatDocumentDate(issuedDate)}</strong>.
                                            </p>
                                            
                                            {/* Details Box */}
                                            <div className="border border-[#e5e5ea] rounded-xl p-5 text-[12px] space-y-2">
                                                <div className="text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-[#e5e5ea] pb-1 mb-2">{t('Updated Terms')}</div>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                    <div><span className="text-[#8e8e93]">{t('Previous Designation')}:</span> <span className="text-slate-500 line-through">{activeDesignation}</span></div>
                                                    <div><span className="text-[#8e8e93]">{t('New Designation')}:</span> <strong className="text-[#1c1c1e]">{newDesignation || t('[New Designation]')}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Department')}:</span> <strong className="text-[#1c1c1e]">{activeDepartment}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Effective Date')}:</span> <strong className="text-[#1c1c1e]">{promotionEffectiveDate ? formatDocumentDate(promotionEffectiveDate) : formatDocumentDate(issuedDate)}</strong></div>
                                                </div>
                                                <div className="mt-3 border-t border-[#e5e5ea] pt-3 flex justify-between items-center">
                                                    <div>
                                                        <span className="text-[#8e8e93]">{t('Previous Salary')}:</span> <span className="text-slate-500 line-through mr-4">{formatCurrency(currentEmployee.basic_salary)} {isYearlySalary ? t('/ year') : t('/ month')}</span>
                                                        <span className="text-[#8e8e93]">{t('New Gross Compensation')}:</span> <strong className="text-[#1c1c1e]">{newSalary ? formatCurrency(parseFloat(newSalary)) : formatCurrency(currentEmployee.basic_salary)} {isYearlySalary ? t('/ year') : t('/ month')}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            {customParagraph && (
                                                <div className="mt-4 text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                                    {customParagraph}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* TERMINATION LETTER */}
                                    {documentType === 'termination_letter' && (
                                        <div className="space-y-4">
                                            <p className="font-bold text-[#1c1c1e] text-sm">Dear {currentEmployee.name.split(' ')[0]},</p>
                                            <p>
                                                This letter serves as official notification that your employment with <strong className="text-[#1c1c1e]">{customCompanyName}</strong> is being terminated.
                                            </p>
                                            <p>
                                                Your final day of employment with the company will be <strong className="text-[#1c1c1e]">{terminationEffectiveDate ? formatDocumentDate(terminationEffectiveDate) : formatDocumentDate(issuedDate)}</strong>.
                                            </p>
                                            
                                            {/* Details Box */}
                                            <div className="border border-[#e5e5ea] rounded-xl p-5 text-[12px] space-y-2">
                                                <div className="text-xs font-bold text-red-800 uppercase tracking-wider border-b border-[#e5e5ea] pb-1 mb-2">{t('Termination Settlement details')}</div>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                    <div><span className="text-[#8e8e93]">{t('Termination Reason')}:</span> <strong className="text-[#1c1c1e]">{terminationReason || t('Performance Issues')}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Last Working Day')}:</span> <strong className="text-[#1c1c1e]">{terminationEffectiveDate ? formatDocumentDate(terminationEffectiveDate) : formatDocumentDate(issuedDate)}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Notice Period (Days)')}:</span> <strong className="text-[#1c1c1e]">{noticePeriod || '30'}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Severance Package')}:</span> <strong className="text-[#1c1c1e]">{severanceAmount ? formatCurrency(parseFloat(severanceAmount)) : t('None / Standard settlement')}</strong></div>
                                                </div>
                                            </div>

                                            {customParagraph && (
                                                <div className="mt-4 text-[13px] text-[#1c1c1e] whitespace-pre-wrap leading-relaxed text-justify">
                                                    {customParagraph}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* GENERAL DOCUMENT / CUSTOM TEMPLATE */}
                                    {!['offer_letter', 'employment_agreement', 'payslip', 'experience_letter', 'relieving_letter', 'promotion_letter', 'termination_letter'].includes(documentType) && (
                                        <div className="space-y-4">
                                            <p className="font-bold text-[#1c1c1e] text-sm">
                                                {t('Dear')} {currentEmployee.name},
                                            </p>
                                            
                                            {/* Standard Employee Info Box */}
                                            <div className="border border-[#e5e5ea] rounded-xl p-5 text-[12px] bg-[#f9f9fa]/50">
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                                    <div><span className="text-[#8e8e93]">{t('Employee Name')}:</span> <strong className="text-[#1c1c1e]">{currentEmployee.name}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Employee ID')}:</span> <strong className="text-[#1c1c1e]">{currentEmployee.employee_id_code}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Designation')}:</span> <strong className="text-[#1c1c1e]">{activeDesignation}</strong></div>
                                                    <div><span className="text-[#8e8e93]">{t('Department')}:</span> <strong className="text-[#1c1c1e]">{activeDepartment}</strong></div>
                                                    {workLocation && (
                                                        <div><span className="text-[#8e8e93]">{t('Location')}:</span> <strong className="text-[#1c1c1e]">{workLocation}</strong></div>
                                                    )}
                                                    <div><span className="text-[#8e8e93]">{t('Date')}:</span> <strong className="text-[#1c1c1e]">{formatDocumentDate(activeDate)}</strong></div>
                                                </div>
                                            </div>

                                            {/* Main Editable Body Text */}
                                            <div className="mt-6 text-[#1c1c1e] whitespace-pre-wrap min-h-[220px] text-justify leading-relaxed">
                                                {customParagraph || (
                                                    <span className="text-gray-400 italic">
                                                        {t('[Document Body Content]')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Custom Appended Paragraph */}
                                    {customParagraph && ['offer_letter', 'payslip'].includes(documentType) && (
                                        <p className="mt-4 border-t border-[#e5e5ea] pt-4 text-[#787880] italic">
                                            {customParagraph}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Signatures, Stamps, and Footer block - Exactly matches the user's PDF */}
                            <div className="mt-12">
                                <div className="flex justify-between items-end mb-8">
                                    <div className="space-y-3">
                                        {/* Official Circular Seal Image */}
                                        {hasSignature && (
                                            <div className="relative h-24 w-24">
                                                <img src="/seal_dynime.png" alt="Dynime Seal" className="h-24 w-24 object-contain" />
                                            </div>
                                        )}
                                        <div className="text-[11px] space-y-0.5">
                                            <p className="text-[#8e8e93] uppercase font-bold text-[9px] tracking-wider mb-1">{t('SYSTEM GENERATED - NO SIGNATURE REQUIRED')}</p>
                                            <p className="font-bold text-[#1c1c1e]">{t('Authorised Signatory')}</p>
                                            <p className="text-[#787880]">Director, {customCompanyName}</p>
                                            <p className="text-[#787880]">{t('Date')}: {formatDocumentDate(activeDate)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-[11px] space-y-1">
                                        {prefill?.payload?.employee_signature ? (
                                            <div className="h-16 w-48 flex justify-end items-end mb-1 overflow-hidden">
                                                <img src={prefill.payload.employee_signature} alt="Employee Signature" className="h-16 object-contain" />
                                            </div>
                                        ) : signatureImage ? (
                                            <div className="h-16 w-32 flex justify-end items-end mb-1">
                                                <img src={signatureImage} alt="Signature" className="h-16 object-contain" />
                                            </div>
                                        ) : (
                                            <div className="font-normal text-[#1c1c1e] mb-1 h-12 flex items-end justify-end text-right pr-2 whitespace-nowrap w-60 ml-auto overflow-visible select-none" style={{ fontFamily: "'Caveat', cursive", fontSize: '24px', letterSpacing: '0.5px' }}>
                                                 {currentEmployee.name}
                                              </div>
                                        )}
                                        <div className="w-60 h-px bg-[#d1d1d6] ml-auto"></div>
                                        <p className="font-bold text-[#1c1c1e] mt-1">{currentEmployee.name}</p>
                                        <p className="text-[#787880]">{t('Employee Acceptance')}</p>
                                        <p className="text-[#787880]">
                                            {t('Date')}: {prefill?.payload?.employee_signature_date ? formatDocumentDate(prefill.payload.employee_signature_date.split(' ')[0]) : formatDocumentDate(activeDate)}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer reference area - 100% Match */}
                                <div className="border-t border-[#e5e5ea] pt-4 text-[10px] text-[#787880]">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="text-left space-y-1">
                                            <span className="block text-[9px] text-[#8e8e93] font-bold uppercase tracking-wider">{t('ISSUED BY')}</span>
                                            <span className="text-[#1c1c1e] font-bold">{customCompanyName}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="block text-[9px] text-[#8e8e93] font-bold uppercase tracking-wider">{t('CONTACT')}</span>
                                            <div className="text-[#787880] flex flex-col items-center justify-center gap-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_email || 'contact@dynime.com'}
                                                    <span className="text-[#e5e5ea]">•</span>
                                                    <Globe className="h-3 w-3 text-[#8e8e93]" /> {companySettings.company_website || 'dynime.com'}
                                                </span>
                                                <span className="flex items-center gap-1 text-[9px]">
                                                    <Phone className="h-2.5 w-2.5 text-[#8e8e93]" /> {companySettings.company_telephone || '+16468840271'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <span className="block text-[9px] text-[#8e8e93] font-bold uppercase tracking-wider">{t('REFERENCE')}</span>
                                            <span className="text-[#1c1c1e] font-semibold">{getDocumentTitle()} • {formatDocumentDate(issuedDate)}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center text-[9px] text-[#8e8e93] border-t border-dashed border-[#e5e5ea] pt-2">
                                        <p>{t('This is an electronically generated document and is valid without a physical signature.')}</p>
                                        <p>© {new Date().getFullYear()} {customCompanyName}</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl w-[794px] h-[1123px] flex flex-col items-center justify-center text-gray-400 p-8">
                            <FileText className="h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-sm font-semibold">{t('Pick an employee to start')}</p>
                        </div>
                    )}
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
