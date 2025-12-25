import { SectionConfig } from './types';

const CHRONIC_PREEXISTING_OPTIONS = [
  'Option 1: Full Coverage',
  'Option 2: 10%',
  'Option 3: 20%',
  'Option 4: 30%',
  'Option 5: 40%',
  'Option 6: 50%',
  'Option 7: 60%',
  'Option 8: 70%',
  'Option 9: 80%',
  'Option 10: 90%',
  'Option 11:100%'
];

export const MEDICAL_SECTIONS: SectionConfig[] = [
  {
    id: 'general',
    title: 'General Limits',
    arabicTitle: 'الحدود العامة',
    rows: [
      { key: 'annualCeiling', label: 'Annual Ceiling per Life Insured', arabicLabel: 'الحد الأقصى للتغطية التأمينية التكافلية للفرد سنوياً', type: 'text' },
      { 
        key: 'worldwide', 
        label: 'Worldwide', 
        arabicLabel: 'النطاق الجغرافي للتغطية التأمينية التكافلية (خارج مصر)', 
        type: 'select',
        options: [
          'Option 1: غير مغطي',
          'Option 2: خارج مصر في الحالات التالية:في حالة الطوارئ خلال رحلات العمل في حالة عدم توافر العلاج في مصر وبشرط الحصول على موافقة الشركة وصاحب العمل'
        ]
      },
      {
        key: 'insideEgypt',
        label: 'Inside Egypt',
        arabicLabel: 'النطاق الجغرافي للتغطية التأمينية التكافلية (داخل مصر)',
        type: 'select',
        options: ['Option 1: داخل مصر (داخل وخارج الشبكة الطبية)']
      },
      {
        key: 'coInsurance',
        label: 'Co-Insurance',
        arabicLabel: 'نسبة التغطية التأمينية التكافلية من الفاتورة المقدمة',
        type: 'percent'
      }
    ]
  },
  {
    id: 'inpatient',
    title: 'In-Patient (Hospital)',
    arabicTitle: 'أولاً: العلاج الداخلي بالمستشفيات',
    rows: [
      {
        key: 'roomType',
        label: 'Room Type',
        arabicLabel: 'نوع الغرفة',
        type: 'select',
        options: ['Option 1: Suite جناح', 'Option 2: Single غرفة مفردة', 'Option 3: Double غرفة مزدوجة']
      },
      {
        key: 'networkType',
        label: 'Network Type',
        arabicLabel: 'نوع الشبكة',
        type: 'select',
        options: [
          'Option 1: Full Network - Tier 4 شبكة كاملة',
          'Option 2: Full Network - Tier 3 شبكة كاملة',
          'Option 3: Restricted Network - Tier 2 شبكة محدودة',
          'Option 4: Restricted Network - Tier 1 شبكة محدودة'
        ]
      },
      { key: 'reimbursement', label: 'Re-imbursement', arabicLabel: 'الحد الأقصى لاسترداد تكلفة الكشف من الفاتورة المقدمة طبقا للتكاليف المناسبة والمتعارف عليها خارج الهيئة الطبية المعتمدة', type: 'percent' },
      { 
        key: 'icuLimit', 
        label: 'ICU Limit', 
        arabicLabel: 'الحد الأقصى للإقامة بالرعاية المركزة يومياً 21 يوماً بحد أقصى', 
        type: 'select',
        options: [
          'Option 1: 14 Days',
          'Option 2: 21 Days',
          'Option 3: 24 Days',
          'Option 4: 30 Days',
          'Option 5: 365 Days'
        ]
      },
      { key: 'surgicalFees', label: 'Surgical & Medical Fees', arabicLabel: 'أتعاب الجراح ومساعد الجراح والتخدير والإشراف الطبي وفتح غرفة العمليات والمستهلكات والفحوص الطبية وزيارات الأطباء وأي خدمات علاجية أو طبية أخرى يتم تقديمها داخل المستشفى (يتم التغطية بنسبة 100% داخل الهيئة الطبية المعتمدة)', type: 'text', fixedValue: '100%' },
      { key: 'emergency', label: 'Emergency services', arabicLabel: 'حالات الطوارئ', type: 'text', fixedValue: '100%' },
      { key: 'ambulance', label: 'Ambulance', arabicLabel: 'الانتقال بسيارة الإسعاف', type: 'text', fixedValue: '100%' },
      { key: 'companion', label: 'Companion Accommodation', arabicLabel: 'إقامة مرافق', type: 'text', fixedValue: '100%' },
    ]
  },
  {
    id: 'outpatient',
    title: 'Out-Patient',
    arabicTitle: 'ثانياً: العلاج بالعيادات الخارجية',
    rows: [
      {
        key: 'physicianCoverageType',
        label: 'Coverage Type',
        arabicLabel: 'نوع التغطية',
        type: 'select',
        options: ['Option 1: Prior Approval']
      },
      { key: 'physicianNetwork', label: 'Physicians (Network)', arabicLabel: 'الحد الأقصى لتكلفة الكشف بالعيادات الخارجية داخل الشبكة', type: 'percent' },
      { key: 'physicianNonNetwork', label: 'Physicians (Non-Network)', arabicLabel: 'الحد الأقصى لتكلفة الكشف من الفاتورة المقدمة طبقا للتكاليف المناسبة والمتعارف عليها خارج الهيئة الطبية المعتمدة', type: 'percent' },
      { key: 'maxConsultation', label: 'Max Consultation Fee', arabicLabel: 'الحد الأقصى لتكلفة الكشف بالعيادات الخارجية بحد اقصى ... جنية للزيارة', type: 'number' },
      {
        key: 'labScanCoverage',
        label: 'Labs & Radiology Coverage Type',
        arabicLabel: 'نوع التغطية (الآشعة والتحاليل)',
        type: 'select',
        options: [
          'Option 1: Prior Approval'
        ]
      },
      { key: 'labScanNetwork', label: 'Labs & Radiology (Network)', arabicLabel: 'الحد الأقصى لتكلفة الكشف بالعيادات الخارجية داخل الشبكة الطبية المعتمدة', type: 'percent' },
      { key: 'labScanNonNetwork', label: 'Labs & Radiology (Non-Network)', arabicLabel: 'الحد الأقصى للاسترداد قيمة الفاتورة المقدمة (بحد أقصى للتكاليف المناسبة والمتعارف عليها- خارج الهيئة الطبية المعتمدة)', type: 'percent' },
      
      // Physiotherapy
      {
        key: 'physioSessions',
        label: 'Physiotherapy Sessions',
        arabicLabel: 'عدد الجلسات العلاج الطبيعي',
        type: 'select',
        options: ['Option 1: 12 جلسة', 'Option 2: 24 جلسة', 'Option 3: 36 جلسة']
      },
      {
        key: 'physioType',
        label: 'Physiotherapy Coverage',
        arabicLabel: 'نوع التغطية',
        type: 'select',
        options: ['Option 1: Prior Approval موافقة مسبقة']
      },
      { key: 'physioNetwork', label: 'Physiotherapy (Network)', arabicLabel: 'الحد الأقصى لتكلفة الكشف بالعيادات الخارجية داخل الشبكة', type: 'percent' },
      { key: 'physioNonNetwork', label: 'Physiotherapy (Non-Network)', arabicLabel: 'الحد الأقصى للاسترداد قيمة الفاتورة المقدمة', type: 'percent' },

      { key: 'medicationNetwork', label: 'Medication (Network)', arabicLabel: 'الأدوية (داخل) الصيدليات المعتمدة', type: 'percent' },
      { key: 'medicationNonNetwork', label: 'Medication (Non-Network)', arabicLabel: 'الأدوية (خارج) الصيدليات المعتمدة', type: 'percent' },
      { key: 'medicationNoApproval', label: 'Medication Limit (No Approval)', arabicLabel: 'الحد الأقصى للصرف دون موافقة مسبقة', type: 'text' },
    ]
  },
  {
    id: 'additional',
    title: 'Additional Benefits',
    arabicTitle: 'ثالثاً: تغطيات إضافية',
    rows: [
      // Doctor on Site
      {
         key: 'doctorOnSite_covered',
         label: 'Doctor on Site',
         arabicLabel: 'طبيب موقع - مغطى/غير مغطى',
         type: 'select',
         options: ['Option 1: مغطى', 'Option 2: غير مغطى']
      },
      { key: 'doctorOnSite_sites', label: 'Sites per visit', arabicLabel: 'عدد المواقع لكل زيارة', type: 'number' },
      { key: 'doctorOnSite_visits', label: 'Visits per week/month', arabicLabel: 'عدد الزيارات في الشهر/الأسبوع', type: 'number' },
      { key: 'doctorOnSite_hours', label: 'Hours per visit', arabicLabel: 'عدد الساعات في الزيارة الواحدة', type: 'number' },
      
      // Dental
      {
        key: 'dental_covered',
        label: 'Dental Coverage',
        arabicLabel: 'علاج الأسنان - مغطى/غير مغطى',
        type: 'select',
        options: ['Option 1: Not Covered غير مغطي', 'Option 2: Prior Approval موافقة مسبقة', 'Option 3: Cash Reimbursement استرداد نقدي']
      },
      { key: 'dental_limit', label: 'Dental Annual Limit', arabicLabel: 'الحد الأقصى للمؤمن عليه في السنة', type: 'text' },
      { key: 'dental_network', label: 'Dental Network %', arabicLabel: 'الحد الأقصى للتغطية (داخل) الشبكة', type: 'percent' },
      { key: 'dental_non_network', label: 'Dental Non-Network %', arabicLabel: 'الحد الأقصى من الفاتورة المقدمة طبقا للتكاليف المناسبة والمتعارف عليها وحتى الحد الأقصى المتاح من التغطية -خارج الهيئة الطبية المعتمدة', type: 'percent' },
      { 
        key: 'dental_level', 
        label: 'Dental Level', 
        arabicLabel: 'مستوى التغطية', 
        type: 'select',
        options: ['Option 1: Advanced Coverage تغطية متقدمة']
      },

      // Optical
      {
        key: 'optical_covered',
        label: 'Optical Coverage',
        arabicLabel: 'البصريات - مغطى/غير مغطى',
        type: 'select',
        options: ['Option 1: Not Covered غير مغطي', 'Option 2: Prior Approval موافقة مسبقة', 'Option 3: Cash Reimbursement استرداد نقدي']
      },
      { key: 'optical_limit', label: 'Optical Annual Limit', arabicLabel: 'الحد الأقصى للمؤمن عليه في السنة', type: 'text' },
      { 
        key: 'optical_network', 
        label: 'Optical Network', 
        arabicLabel: 'الحد الأقصى للتغطية (داخل) الشبكة الطبية المعتمدة', 
        type: 'select', 
        options: [
          'Option 1: Fixed Number from total population عدد ثابت من إجمالي المؤمن عليهم', 
          'Option 2: Percentage of total population نسبة من إجمالي عدد المؤمن عليهم'
        ] 
      },
      { key: 'optical_non_network', label: 'Optical Non-Network %', arabicLabel: 'الحد الأقصى من الفاتورة المقدمة طبقا للتكاليف المناسبة والمتعارف عليها وحتى الحد الأقصى المتاح من التغطية -خارج الهيئة الطبية المعتمدة', type: 'percent' },
      { 
        key: 'optical_frequency', 
        label: 'Optical Frequency', 
        arabicLabel: 'الحد الأقصى لعدد النظارات', 
        type: 'select',
        options: ['Option 1: كشف نظر مرة واحدة في السنة ونظارة أو عدسات اللاصقة كل سنتين']
      },
      
      // Maternity
      {
        key: 'maternity_covered',
        label: 'Maternity Coverage',
        arabicLabel: 'الحمل والولادة - مغطى/غير مغطى',
        type: 'select',
        options: ['Option 1: مغطى', 'Option 2: غير مغطى']
      },
      {
        key: 'maternity_cases',
        label: 'Cases Count Per Year',
        arabicLabel: 'عدد الحالات في السنة',
        type: 'select',
        options: ['Option 1: مغطى', 'Option 2: غير مغطى']
      },
      { key: 'maternity_limit', label: 'Maternity Annual Limit', arabicLabel: 'الحد الأقصى للمؤمن عليه في السنة', type: 'text' },
      { key: 'maternity_natural', label: 'Natural Birth Limit', arabicLabel: 'الحد الأقصى للولادة الطبيعية', type: 'text' },
      { key: 'maternity_csection', label: 'C-Section Limit', arabicLabel: 'الحد الأقصى للولادة القيصرية', type: 'text' },
      { key: 'maternity_abortion', label: 'Legal Abortion Limit', arabicLabel: 'الحد الأقصى للإجهاض القانوني بالجنيه المصري', type: 'text' },
      { key: 'maternity_network', label: 'Maternity Network %', arabicLabel: 'نسبة التغطية داخل شبكة الأطباء المعتمدة', type: 'percent' },
      { key: 'maternity_non_network', label: 'Maternity Non-Network %', arabicLabel: 'الحد الأقصى من الفاتورة المقدمة طبقا للتكاليف المناسبة والمتعارف عليها وحتى الحد الأقصى المتاح من التغطية -خارج الهيئة الطبية المعتمدة', type: 'percent' },
      
      // Chronic
      {
        key: 'chronic_covered',
        label: 'Chronic Medication',
        arabicLabel: 'الأمراض المزمنة والحرجة',
        type: 'select',
        options: CHRONIC_PREEXISTING_OPTIONS
      },
      { key: 'chronic_limit', label: 'Chronic Limit', arabicLabel: 'الحد الأقصى للمؤمن عليه في السنة', type: 'text' },

      // Pre-existing
      {
        key: 'preexisting_covered',
        label: 'Pre-Existing Diseases',
        arabicLabel: 'الأمراض السابقة للتعاقد',
        type: 'select',
        options: CHRONIC_PREEXISTING_OPTIONS
      },
      { key: 'preexisting_new_joiners', label: 'New Joiners Limit', arabicLabel: 'الحد الأقصى للمنضمين حديثاً', type: 'text' },
      { key: 'preexisting_limit', label: 'Annual Limit per Person', arabicLabel: 'الحد الأقصى المتاح للفرد الواحد في السنة بالجنيه المصري', type: 'text' },
      
       // Side Fund
      {
        key: 'sidefund_covered',
        label: 'Side Fund',
        arabicLabel: 'مخصص استثنائي',
        type: 'select',
        options: ['Option 1: مغطى', 'Option 2: غير مغطى']
      },
      { key: 'sidefund_value', label: 'Side Fund Value', arabicLabel: 'قيمة المخصص بالجنيه المصري', type: 'text' },
    ]
  }
];

export const LIFE_SECTIONS: SectionConfig[] = [
  {
    id: 'life_general',
    title: 'Life Insurance Details',
    rows: [
      { key: 'life_schemeName', label: 'Scheme Name', type: 'text' },
      { key: 'life_quoteDate', label: 'Quote / Renewal Date', type: 'date' },
      { key: 'life_reinsurer', label: 'Existing Reinsurer', type: 'text' },
      { key: 'life_businessNature', label: 'Nature of Business', type: 'text' },
      { key: 'life_currency', label: 'Currency', type: 'text' },
      { key: 'life_retirementAge', label: 'Retirement Age', type: 'text' },
      { key: 'life_lom', label: 'Detailed LOM', type: 'textarea' },
    ]
  },
  {
    id: 'life_coverage',
    title: 'Coverage Details',
    rows: [
      { key: 'life_prevInsured', label: 'Previously Insured', type: 'text' },
      { key: 'life_reqBenefits', label: 'Requested Benefits', type: 'text' },
      { key: 'life_prevBenefits', label: 'Previous Covered Benefits', type: 'text' },
      { key: 'life_sumCriteria', label: 'Sum Insured Criteria', type: 'text' },
      { key: 'life_reqBasicSum', label: 'Requested Basic Sum Insured', type: 'text' },
      { key: 'life_currBasicSum', label: 'Current Basic Sum Insured', type: 'text' },
      { key: 'life_occupations', label: 'Occupation per Employee', type: 'text' },
    ]
  },
  {
    id: 'life_distribution',
    title: 'Distribution Channel',
    rows: [
      { key: 'life_channel', label: 'Channel Type', type: 'select', options: ['Option 1: Direct', 'Option 2: Agency', 'Option 3: Broker'] },
      { key: 'life_brokerName', label: 'Agent / Broker Name', type: 'text' },
      { key: 'life_commission', label: 'Commission %', type: 'text' },
    ]
  }
];

export const PENSION_SECTIONS: SectionConfig[] = [
  {
    id: 'pension_general',
    title: 'Pension Scheme Details',
    rows: [
      { key: 'pension_companyName', label: 'Company Name', type: 'text' },
      { key: 'pension_businessNature', label: 'Business Nature', type: 'text' },
      { key: 'pension_membersList', label: 'List of members', type: 'select', options: ['Option 1: Attached', 'Option 2: No Data'] },
      { key: 'pension_salaryIncrease', label: 'Salary Annual Increase %', type: 'text' },
      { key: 'pension_retirementAge', label: 'Retirement Age', type: 'number' },
      { key: 'pension_currency', label: 'Currency', type: 'select', options: ['Option 1: EGP', 'Option 2: USD'] },
      { key: 'pension_planType', label: 'Requested Plan Type', type: 'select', options: ['Option 1: Defined Contribution', 'Option 2: Target Benefit'] },
      { key: 'pension_openingBalance', label: 'Opening Balance', type: 'select', options: ['Option 1: Yes Attached', 'Option 2: No'] },
      { key: 'pension_paymentMode', label: 'Mode of payment', type: 'select', options: ['Option 1: Annual', 'Option 2: Semi-Annual', 'Option 3: Quarterly', 'Option 4: Monthly', 'Option 5: One single cont.'] },
      { key: 'pension_distribution', label: 'Distribution Channel', type: 'select', options: ['Option 1: Direct', 'Option 2: Brokerage', 'Option 3: Ind Broker', 'Option 4: Agency'] },
      { key: 'pension_brokerName', label: 'Ind Broker Name (if Any)', type: 'text' },
      { key: 'pension_fraCode', label: 'FRA Code', type: 'text' },
      { key: 'pension_notes', label: 'Additional Notes', type: 'textarea' },
    ]
  },
  {
    id: 'pension_defined',
    title: 'Requested Plan: (Defined Contribution)',
    rows: [
      { key: 'pension_contribBase', label: 'Contributions Base', type: 'select', options: ['Option 1: % of Salary', 'Option 2: Fixed Amount'] },
      { key: 'pension_empCont', label: 'Employee Cont. %', type: 'text' },
      { key: 'pension_employerCont', label: 'Employer Cont. %', type: 'text' },
      { key: 'pension_fixedAmount', label: 'Fixed amount', type: 'select', options: ['Option 1: Yes Attached', 'Option 2: Yes include number', 'Option 3: No'] },
    ]
  },
  {
    id: 'pension_target',
    title: 'Requested Plan: (Target Benefit)',
    rows: [
      { key: 'pension_reqTarget', label: 'Requested Target', type: 'select', options: ['Option 1: Multiplication of Salary', 'Option 2: Fixed Amount'] },
      { key: 'pension_multiplier', label: 'Number of multiplication', type: 'text' },
      { key: 'pension_calcBase', label: 'Multiplication Calc Base', type: 'select', options: ['Option 1: Contribution date', 'Option 2: Hiring date'] },
      { key: 'pension_salaryBase', label: 'Salary Base', type: 'select', options: ['Option 1: Retirement Salary', 'Option 2: Current Salary'] },
    ]
  }
];

export const CREDIT_SECTIONS: SectionConfig[] = [
  {
    id: 'credit_general',
    title: 'Credit Life Policy Details',
    rows: [
      { key: 'credit_bankName', label: 'Institution/Bank Name', type: 'text' },
      { key: 'credit_businessNature', label: 'Business Nature', type: 'text' },
      { key: 'credit_membersList', label: 'List of members', type: 'select', options: ['Option 1: Attached', 'Option 2: No Data'] },
      { key: 'credit_inceptionDate', label: 'Expected Inception Date', type: 'date' },
      { key: 'credit_policyType', label: 'Type of Policy Requested', type: 'select', options: ['Option 1: Existing Renewal', 'Option 2: Another Insurer (Transfer)', 'Option 3: Virgin Business', 'Option 4: Startup'] },
      { key: 'credit_currency', label: 'Currency', type: 'select', options: ['Option 1: EGP', 'Option 2: USD'] },
      { key: 'credit_paymentMode', label: 'Mode of payment', type: 'select', options: ['Option 1: Annual', 'Option 2: Semi-Annual', 'Option 3: Quarterly', 'Option 4: Monthly', 'Option 5: One single cont.'] },
      { key: 'credit_distribution', label: 'Distribution Channel', type: 'select', options: ['Option 1: Direct', 'Option 2: Brokerage', 'Option 3: Ind Broker', 'Option 4: Agency'] },
      { key: 'credit_brokerName', label: 'Brokerage Name (If Any)', type: 'text' },
      { key: 'credit_fraCode', label: 'FRA Code', type: 'text' },
      { key: 'credit_commission', label: 'Requested Commission %', type: 'text' },
      { key: 'credit_comments', label: 'Additional Comments', type: 'textarea' },
    ]
  },
  {
    id: 'credit_renewal',
    title: 'Current/Renewal Policy Details',
    rows: [
      { key: 'credit_currInsurer', label: 'Current Insurer', type: 'text' },
      { key: 'credit_currRate', label: 'Current Rate', type: 'text' },
      { key: 'credit_expiryDate', label: 'Expiry Date', type: 'date' },
      { key: 'credit_reason', label: 'Reason for Seeking Quotation', type: 'select', options: ['Option 1: Renewal', 'Option 2: Competitive Pricing', 'Option 3: Service Issues', 'Option 4: Cover Enhancements', 'Option 5: Tender', 'Option 6: Other'] },
      { key: 'credit_otherReason', label: 'If Other', type: 'text' },
    ]
  },
  {
    id: 'credit_scheme',
    title: 'Scheme Details (Requested)',
    rows: [
      { key: 'credit_schemeType', label: 'Scheme Type', type: 'select', options: ['Option 1: Decreasing loan', 'Option 2: Fixed Amount', 'Option 3: Revolving CC'] },
      { key: 'credit_loanType', label: 'Loan Type', type: 'text' },
      { key: 'credit_schemeInception', label: 'Inception Date', type: 'date' },
    ]
  },
  {
    id: 'credit_guidelines',
    title: 'Requested Underwriting Guidelines',
    rows: [
      { key: 'credit_minAge', label: 'Minimum Entry Age', type: 'number' },
      { key: 'credit_maxAge', label: 'Maximum Entry Age', type: 'number' },
      { key: 'credit_maxCoverAge', label: 'Maximum Coverage Age', type: 'number' },
      { key: 'credit_freeCover', label: 'Free Cover Limit', type: 'number' },
      { key: 'credit_nonMedical', label: 'Non Medical Limit', type: 'number' },
      { key: 'credit_maxSum', label: 'Maximum Sum Insured', type: 'number' },
      { key: 'credit_preExclusion', label: 'Pre-existing Condition Exclusion (Months)', type: 'text' },
      { key: 'credit_suicide', label: 'Suicide Exclusion (Months)', type: 'text' },
      { key: 'credit_profitShare', label: 'Profit Share', type: 'select', options: ['Option 1: Yes', 'Option 2: No'] },
      { key: 'credit_formula', label: 'Profit Share Formula', type: 'text' },
    ]
  }
];