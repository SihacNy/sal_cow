import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        dashboard: "Dashboard",
        liveScale: "Live Scale",
        cattleRecords: "Cattle Records",
        weightHistory: "Weight History",
        reports: "Reports",
        analytics: "Analytics",
        settings: "Settings"
      },
      common: {
        kg: "kg",
        stable: "Stable",
        unstable: "Unstable",
        online: "Online",
        offline: "Offline",
        search: "Search...",
        filter: "Filter",
        all: "All",
        gender: "Gender",
        breed: "Breed",
        actions: "Actions",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        ageYears: "{{count}} yr(s)",
        ageMonths: "{{count}} mo(s)",
        none: "None"
      },
      dashboard: {
        totalCows: "Total Cows",
        averageWeight: "Average Weight",
        heaviestCow: "Heaviest Cow",
        lightestCow: "Lightest Cow",
        todayWeighings: "Weighed Today",
        weeklyWeighings: "Weekly Weighings",
        onlineDevices: "Online Devices",
        recentAlerts: "Recent Alerts",
        recentActivity: "Recent Weighing Events",
        liveScaleStream: "Live Scale Stream",
        alertHeader: "System Alerts",
        activeAlerts: "Active Alerts",
        viewAll: "View All",
        weighCattle: "Weigh Cattle",
        trendHeader: "Growth Activity Tracking",
        quickStats: "Herd Overview",
        weightLossWarning: "Weight Loss Detected",
        deviceOfflineWarning: "Scale Offline",
        noRecentWeighWarning: "No Recent Weighing",
        noAlerts: "No active alerts. Your herd is in healthy status."
      },
      liveScale: {
        mainTitle: "Dynamic Live Scale Reader",
        sensorLabel: "Load Cell Connection",
        currentCattleWeight: "Current Cattle Weight",
        statusLabel: "Status",
        timestampLabel: "Weighing Time",
        readyToWeigh: "Ready to Weigh",
        weighing: "Weighing...",
        stableCaptured: "Stable Weight Captured",
        selectCowPrompt: "Bind Reading to Cow Record",
        bindButton: "Lock & Save Weight Log",
        noCowSelectedErr: "Please select a cattle first to bind this weight",
        successSave: "Successfully saved weight record!",
        unidentifiedCattle: "Register Manual Unbound Weight"
      },
      cattleRecords: {
        title: "Cattle Management",
        addCow: "Add New Cow",
        editCow: "Edit Cow",
        deleteCow: "Delete Cow Record",
        searchPlaceholder: "Search by ID or Name...",
        cowId: "Cattle ID",
        name: "Cattle Name",
        breed: "Breed",
        gender: "Gender",
        birthDate: "Birth Date",
        image: "Cattle Photo (URL or Upload)",
        confirmDelete: "Are you sure you want to delete cattle {{name}}?",
        female: "Female",
        male: "Male"
      },
      weightHistory: {
        title: "Herd Weighing History",
        timestamp: "Timestamp / Date",
        cowInfo: "Cattle Information",
        weight: "Recorded Weight",
        status: "Weighing Status",
        device: "Weighing Unit / Device",
        exportCsv: "Export CSV",
        exportExcel: "Export Excel",
        exportPdf: "Export PDF",
        filterDevice: "Device Filter"
      },
      reports: {
        title: "Cattle Performance Reports",
        dailyReport: "Daily Report",
        weeklyReport: "Weekly Report",
        monthlyReport: "Monthly Report",
        averageWeight: "Average Herd Weight",
        weightGain: "Weight Gained Rate",
        weightLoss: "Weight Lost Rate",
        mostImproved: "Most Improved Cattle",
        leastImproved: "Underperforming Cattle",
        generatePDF: "Download PDF Statement",
        generateExcel: "Export Excel Sheet",
        gainOverall: "Total Gained: +{{val}} kg",
        avgDailyGain: "ADG: {{avg}} kg/day",
        performanceTable: "Cattle Performance Metrics"
      },
      analytics: {
        title: "Herd Growth Analytics",
        weightDistribution: "Weight Classification Distribution",
        breedComparison: "Average Weights by Breed",
        topGainers: "Top Performing Growth Cattle",
        growthTrends: "Monthly Growth Trajectory",
        underperforming: "Slow Growth Action List"
      },
      settings: {
        title: "Farm Settings",
        backendUrl: "Local Backend Gateway URL",
        language: "Preferred Language",
        theme: "Visual Color Theme",
        themeLight: "Light Theme (Eggshell)",
        themeDark: "Dark Charcoal",
        themeFarm: "Farm Theme (Pastoral Green)",
        notifications: "Notification Rules & Sound",
        soundEnabled: "Enable Sound Effects on Stable Lock",
        vibrations: "Vibrate on Warning Alerts",
        sysInfo: "System Diagnostics & Hardware Status"
      }
    }
  },
  km: {
    translation: {
      nav: {
        dashboard: "ផ្ទាំងព័ត៌មាន",
        liveScale: "ជញ្ជីងបន្តផ្ទាល់",
        cattleRecords: "ប្រវត្តិគោក្របី",
        weightHistory: "ប្រវត្តិនៃការថ្លឹង",
        reports: "របាយការណ៍",
        analytics: "ការវិភាគ",
        settings: "ការកំណត់"
      },
      common: {
        kg: "គីឡូក្រាម",
        stable: "នឹងថ្កល់",
        unstable: "រំញ័រ",
        online: "អនឡាញ",
        offline: "អហ្វឡាញ",
        search: "ស្វែងរក...",
        filter: "ចម្រោះ",
        all: "ទាំងអស់",
        gender: "ភេទ",
        breed: "ពូជ",
        actions: "សកម្មភាព",
        save: "រក្សាទុក",
        cancel: "បោះបង់",
        delete: "លុប",
        edit: "កែប្រែ",
        ageYears: "{{count}} ឆ្នាំ",
        ageMonths: "{{count}} ខែ",
        none: "គ្មាន"
      },
      dashboard: {
        totalCows: "ចំនួនគោក្របីសរុប",
        averageWeight: "ទម្ងន់ជាមធ្យម",
        heaviestCow: "គោដែលមានទម្ងន់ធ្ងន់ជាងគេ",
        lightestCow: "គោដែលមានទម្ងន់ស្រាលជាងគេ",
        todayWeighings: "បានថ្លឹងថ្ងៃនេះ",
        weeklyWeighings: "ថ្លឹងប្រចាំសប្តាហ៍",
        onlineDevices: "ជញ្ជីងកំពុងភ្ជាប់",
        recentAlerts: "ការជូនដំណឹងថ្មីៗ",
        recentActivity: "ព្រឹត្តិការណ៍ថ្លឹងទម្ងន់ថ្មីៗ",
        liveScaleStream: "ទិន្នន័យជញ្ជីងផ្ទាល់",
        alertHeader: "ការជូនដំណឹងប្រព័ន្ធ",
        activeAlerts: "សកម្មភាពជូនដំណឹង",
        viewAll: "មើលទាំងអស់",
        weighCattle: "ថ្លឹងគោក្របី",
        trendHeader: "ការតាមដានការលូតលាស់សត្វ",
        quickStats: "ទិដ្ឋភាពទូទៅនៃហ្វូងសត្វ",
        weightLossWarning: "រកឃើញការស្រកទម្ងន់",
        deviceOfflineWarning: "ឧបករណ៍ដាច់ទំនាក់ទំនង",
        noRecentWeighWarning: "មិនបានថ្លឹងថ្មីៗ",
        noAlerts: "គ្មានការជូនដំណឹង។ ហ្វូងសត្វរបស់អ្នកមានសុខភាពល្អធម្មតា។"
      },
      liveScale: {
        mainTitle: "ម៉ាស៊ីនបង្ហាញទម្ងន់បន្តផ្ទាល់",
        sensorLabel: "ការភ្ជាប់ឧបករណ៍ថ្លឹង",
        currentCattleWeight: "ទម្ងន់គោក្របីបច្ចុប្បន្ន",
        statusLabel: "ស្ថានភាព",
        timestampLabel: "ម៉ោងថ្លឹង",
        readyToWeigh: "ត្រៀមខ្លួនថ្លឹង",
        weighing: "កំពុងថ្លឹង...",
        stableCaptured: "ទទួលបានទម្ងន់នឹងថ្កល់",
        selectCowPrompt: "ភ្ជាប់ទម្ងន់នេះទៅកាន់ប្រវត្តិគោ",
        bindButton: "ចាក់សោរ និងកត់ត្រាទម្ងន់",
        noCowSelectedErr: "សូមជ្រើសរើសគោជាមុនសិន ដើម្បីកត់ត្រាទម្ងន់នេះ",
        successSave: "បានកត់ត្រាទម្ងន់ដោយជោគជ័យ!",
        unidentifiedCattle: "កត់ត្រាទម្ងន់ផ្ទាល់ខ្លួន (មិនភ្ជាប់លេខសម្គាល់)"
      },
      cattleRecords: {
        title: "ការគ្រប់គ្រងព័ត៌មានគោក្របី",
        addCow: "បន្ថែមគោថ្មី",
        editCow: "កែប្រែព័ត៌មានគោ",
        deleteCow: "លុបប្រវត្តិគោ",
        searchPlaceholder: "ស្វែងរកតាមលេខសម្គាល់ ឬឈ្មោះ...",
        cowId: "លេខសម្គាល់គោ",
        name: "ឈ្មោះគោ",
        breed: "ពូជ",
        gender: "ភេទ",
        birthDate: "ថ្ងៃខែឆ្នាំកំណើត",
        image: "រូបថតគោ (តំណភ្ជាប់ ឬការផ្ទុកឡើង)",
        confirmDelete: "តើអ្នកប្រាកដជាចង់លុបព័ត៌មានគោ {{name}} មែនទេ?",
        female: "ញី",
        male: "ឈ្មោល"
      },
      weightHistory: {
        title: "ប្រវត្តិនៃការថ្លឹងទម្ងន់ហ្វូងសត្វ",
        timestamp: "កាលបរិច្ឆេទ / ម៉ោង",
        cowInfo: "ព័ត៌មានគោក្របី",
        weight: "ទម្ងន់ដែលបានថ្លឹង",
        status: "ស្ថានភាពជញ្ជីង",
        device: "លេខម៉ាស៊ីនជញ្ជីង",
        exportCsv: "នាំចេញជា CSV",
        exportExcel: "នាំចេញជា Excel",
        exportPdf: "នាំចេញជា PDF",
        filterDevice: "ចម្រោះតាមឧបករណ៍"
      },
      reports: {
        title: "របាយការណ៍ការលូតលាស់សត្វ",
        dailyReport: "របាយការណ៍ប្រចាំថ្ងៃ",
        weeklyReport: "របាយការណ៍ប្រចាំសប្តាហ៍",
        monthlyReport: "របាយការណ៍ប្រចាំខែ",
        averageWeight: "ទម្ងន់មធ្យមហ្វូងសត្វ",
        weightGain: "អត្រាឡើងទម្ងន់",
        weightLoss: "អត្រាស្រកទម្ងន់",
        mostImproved: "គោលូតលាស់ល្អបំផុត",
        leastImproved: "គោលូតលាស់យឺតបំផុត",
        generatePDF: "ទាញយកជារបាយការណ៍ PDF",
        generateExcel: "នាំចេញជាសន្លឹកកិច្ចការ Excel",
        gainOverall: "ឡើងសរុប: +{{val}} គីឡូក្រាម",
        avgDailyGain: "ADG: {{avg}} គីឡូក្រាម/ថ្ងៃ",
        performanceTable: "តារាងលទ្ធផលលូតលាស់សត្វ"
      },
      analytics: {
        title: "ការវិភាគការលូតលាស់ហ្វូងសត្វ",
        weightDistribution: "ការបែងចែកកម្រិតទម្ងន់សត្វ",
        breedComparison: "ទម្ងន់មធ្យមប្រៀបធៀបតាមពូជ",
        topGainers: "គោដែលមានកំណើនទម្ងន់ខ្ពស់បំផុត",
        growthTrends: "និន្នាការកំណើនប្រចាំខែ",
        underperforming: "បញ្ជីគោលូតលាស់យឺតចាំបាច់ត្រូវយកចិត្តទុកដាក់"
      },
      settings: {
        title: "ការកំណត់កសិដ្ឋាន",
        backendUrl: "តំណភ្ជាប់ទៅកាន់ប្រព័ន្ធ Backend",
        language: "ភាសាជ្រើសរើស",
        theme: "ពណ៌ផ្ទៃកម្មវិធី",
        themeLight: "ផ្ទៃភ្លឺ (ពណ៌ស៊ុតមាន់)",
        themeDark: "ផ្ទៃងងឹត (ពណ៌ធ្យូង)",
        themeFarm: "ផ្ទៃកសិដ្ឋាន (ពណ៌បៃតងធម្មជាតិ)",
        notifications: "ការជូនដំណឹង និងសំឡេង",
        soundEnabled: "លេងសំឡេងនៅពេលថ្លឹងបាននឹងថ្កល់",
        vibrations: "ញ័រទូរស័ព្ទនៅពេលមានការជូនដំណឹងគ្រោះថ្នាក់",
        sysInfo: "ព័ត៌មានប្រព័ន្ធ និងស្ថានភាពបច្ចេកទេស"
      }
    }
  }
};

const savedLanguage = localStorage.getItem('app_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  localStorage.setItem('app_language', lng);
};
