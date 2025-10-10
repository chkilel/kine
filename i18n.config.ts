import { defineI18nConfig } from '#i18n'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: process.env.I18N_DEFAULT_LOCALE || 'fr',
  messages: {
    fr: {
      app: {
        title: 'Kine App',
        dashboard: 'Tableau de bord',
        customers: 'Patients',
        inbox: 'Boîte de réception',
        settings: 'Paramètres'
      }
    },
    ar: {
      app: {
        title: 'تطبيق كيني',
        dashboard: 'لوحة التحكم',
        customers: 'المرضى',
        inbox: 'صندوق الوارد',
        settings: 'الإعدادات'
      }
    }
  }
}))