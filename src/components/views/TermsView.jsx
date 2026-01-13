// Terms View - Documentation and conditions
import { memo } from 'react';
import { FileText, BookOpen, Code, Calculator } from 'lucide-react';

export const TermsView = memo(({ t, lang }) => {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t('terms')}
        </h1>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600 dark:text-indigo-400" />
              {t('termsIntroduction') || 'Introduktion'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('termsIntroductionText') || 'Denna dokumentation beskriver alla funktioner, formler och villkor i Projektplanering-applikationen. Här hittar du detaljerad information om hur systemet fungerar.'}
            </p>
          </section>

          {/* Navigation Section */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {t('termsNavigation') || 'Navigation'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('termsNavigationStructure') || 'Applikationen har två sidebars: NavigationSidebar (vänster) för att växla mellan vyer, och Sidebar (uppgiftslista) som visas i Gantt-vyn.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsDashboard') || 'Dashboard (NAVET)'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('termsDashboardText') || 'Dashboard visar översiktlig statistik och analyser:'}
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>{t('termsDashboardItem1') || 'Statistikkort: Totalt, Aktiva, Klar, Försenade, Planerade, Pågående'}</li>
                  <li>{t('termsDashboardItem2') || 'Prioritetsfördelning - visar antal deluppgifter per prioritet (Hög, Normal, Låg)'}</li>
                  <li>{t('termsDashboardItem3') || 'Belastning per handläggare - visar arbetsbelastning per person (HL)'}</li>
                  <li>{t('termsDashboardItem4') || 'Statusfördelning - visar antal uppgifter per status (diagram)'}</li>
                  <li>{t('termsDashboardItem5') || 'Fasfördelning - visar antal uppgifter per fas'}</li>
                  <li>{t('termsDashboardItem6') || "Dagens fokus - försenade uppgifter och uppgifter som startar denna vecka"}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsGantt') || 'Uppgifter (Gantt)'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('termsGanttText') || 'Uppgifter-vyn (tidigare Gantt) har tre lägen: Lista, Delad, eller Gantt. Gantt-diagrammet visar uppgifter i tidslinje:'}
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>{t('termsGanttItem1') || 'Zoom-nivåer: Dag (40px cellbredd), Vecka (20px), Månad (10px)'}</li>
                  <li>{t('termsGanttItem2') || 'Drag-and-drop för att flytta uppgifter'}</li>
                  <li>{t('termsGanttItem3') || 'Visar varningar och försenade uppgifter'}</li>
                  <li>{t('termsGanttItem4') || 'Milstolpar visas som diamanter när startdatum = slutdatum'}</li>
                  <li>{t('termsGanttItem5') || 'Vy-lägen: Lista (endast uppgiftslista), Delad (lista + Gantt), Gantt (endast Gantt)'}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsQuickList') || 'Snabb-lista'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('termsQuickListText') || 'Snabblistan för snabba uppgifter:'}
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>{t('termsQuickListItem1') || 'Prioritet: Hög, Normal, eller Låg'}</li>
                  <li>{t('termsQuickListItem2') || 'Typ: Jobb eller Privat'}</li>
                  <li>{t('termsQuickListItem3') || 'Deadline: Datum för slutförande'}</li>
                  <li>{t('termsQuickListItem4') || 'Kommentar: Ytterligare information'}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsArchive') || 'Arkiv'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('termsArchiveText') || 'Visar alla slutförda (klara) uppgifter. Uppgifter markeras som klara när status = "Klar" eller "Done".'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsTrash') || 'Papperskorg'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('termsTrashText') || 'Visar alla raderade uppgifter. Uppgifter kan återställas eller raderas permanent.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsSettings') || 'Inställningar'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('termsSettingsText') || 'Inställningar för varningar, checklist-visning, säkerhetskopiering och datahantering.'}
                </p>
              </div>
            </div>
          </section>

          {/* Header Section */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {t('termsHeader') || 'Header-funktioner'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsSearch') || 'Sök'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('termsSearchText') || 'Sökfunktion för att filtrera uppgifter. Tryck "Q" i sökfältet för att öppna snabblistan.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsLanguage') || 'Språk'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('termsLanguageText') || 'Växla mellan svenska och engelska. Alla texter och etiketter uppdateras automatiskt.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsTheme') || 'Tema'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('termsThemeText') || 'Växla mellan ljust och mörkt tema. Inställningen sparas i webbläsaren.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsZoom') || 'Zoom-kontroller'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('termsZoomText') || 'Tre zoom-nivåer för Gantt-diagrammet:'}
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>{t('termsZoomItem1') || 'Dag: cellWidth = 40px'}</li>
                  <li>{t('termsZoomItem2') || 'Vecka: cellWidth = 20px'}</li>
                  <li>{t('termsZoomItem3') || 'Månad: cellWidth = 10px'}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsViewModes') || 'Vy-lägen'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('termsViewModesText') || 'Tre vy-lägen för Gantt:'}
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>{t('termsViewModesItem1') || 'Lista: Endast task-lista'}</li>
                  <li>{t('termsViewModesItem2') || 'Delad: Task-lista + Gantt-diagram'}</li>
                  <li>{t('termsViewModesItem3') || 'Gantt: Endast Gantt-diagram'}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsExport') || 'Exportera CSV'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('termsExportText') || 'Exporterar alla uppgifter till CSV-fil för analys i Excel eller liknande program.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsNewTask') || 'Ny uppgift'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('termsNewTaskText') || 'Skapar en ny uppgift. Öppnar TaskModal där du kan ange alla detaljer.'}
                </p>
              </div>
            </div>
          </section>

          {/* Sidebar Section */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {t('termsSidebar') || 'Uppgiftslista (Sidebar)'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('termsSidebarNote') || 'OBS: Detta avser uppgiftslistan (Sidebar) som visas i Gantt-vyn, INTE NavigationSidebar (vänster sidebar för vyval).'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsSorting') || 'Sortering'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('termsSortingText') || 'Sorteringsalternativ:'}
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>{t('termsSortingItem1') || 'Startdatum: Sorterar efter task.startDate'}</li>
                  <li>{t('termsSortingItem2') || 'Slutdatum: Sorterar efter task.endDate'}</li>
                  <li>{t('termsSortingItem3') || 'Namn: Sorterar efter task.title (alfabetiskt)'}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsPhaseGrouping') || 'Fas-gruppering'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('termsPhaseGroupingText') || 'Uppgifter grupperas automatiskt per fas (task.phase). Varje fas visar antal uppgifter.'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsTaskExpansion') || 'Task-expansion'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('termsTaskExpansionText') || 'Klicka på en uppgift för att expandera/collapse och visa/dölja deluppgifter (checklist items).'}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsChecklist') || 'Checklist Items (Deluppgifter)'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('termsChecklistText') || 'Deluppgifter har följande egenskaper:'}
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>{t('termsChecklistItem1') || 'Done-status: item.done (true/false)'}</li>
                  <li>{t('termsChecklistItem2') || 'Prioritet: item.priority (Hög, Normal, Låg)'}</li>
                  <li>{t('termsChecklistItem3') || 'Handläggare: item.executor'}</li>
                  <li>{t('termsChecklistItem4') || 'Startdatum och slutdatum'}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('termsWarningIndicators') || 'Varningsindikatorer'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('termsWarningIndicatorsText') || 'Varningar visas när deadline närmar sig eller har passerat. Se formler nedan för detaljer.'}
                </p>
              </div>
            </div>
          </section>

          {/* Formulas and Conditions Section */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-indigo-600 dark:text-indigo-400" />
              {t('termsFormulas') || 'Formler och Villkor'}
            </h2>
            
            <div className="space-y-6">
              {/* Task Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Code size={18} />
                  {t('termsTaskStatus') || 'Task Status (getTaskDisplayStatus)'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {t('termsTaskStatusText') || 'Status beräknas enligt följande regler:'}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
{`Regel A: Om task.status innehåller "klar" eller "done"
  → Returnera "Klar" (oavsett datum)

Regel B: Om task.endDate finns OCH endDate < idag (dag-nivå)
  → Returnera "Försenad"
  → Formel: end.setHours(0,0,0,0) < today.setHours(0,0,0,0)

Regel C: Annars
  → Returnera task.status (normaliserad till "Planerad", "Pågående", etc.)`}
                  </pre>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                  {t('termsTaskStatusNote') || 'OBS: "Försenad" sparas ALDRIG i task.status. Det är endast för visning.'}
                </p>
              </div>

              {/* Priority Normalization */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Code size={18} />
                  {t('termsPriorityNormalization') || 'Prioritet Normalisering (normalizeSubtaskPriority)'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {t('termsPriorityNormalizationText') || 'Normaliserar prioritet till standardformat:'}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
{`Input: 'high', 'hög', 'Hög', 'hog' → Output: 'Hög'
Input: 'normal', 'Normal' → Output: 'Normal'
Input: 'low', 'låg', 'Låg', 'lag' → Output: 'Låg'
Input: undefined, null, tom sträng → Output: 'Normal' (default)`}
                  </pre>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                  {t('termsPriorityNote') || 'OBS: Prioritet finns ENDAST på deluppgifter (checklist items), INTE på huvuduppgifter.'}
                </p>
              </div>

              {/* Active Subtask */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Code size={18} />
                  {t('termsActiveSubtask') || 'Aktiv Deluppgift (isActiveSubtask)'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {t('termsActiveSubtaskText') || 'En deluppgift är aktiv om ALLA följande villkor är uppfyllda:'}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
{`item.done !== true
item.deleted !== true (om fält finns)
item.archived !== true (om fält finns)`}
                  </pre>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                  {t('termsActiveSubtaskNote') || 'Endast aktiva deluppgifter räknas i Prioritetsfördelning och Belastning.'}
                </p>
              </div>

              {/* Time Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Code size={18} />
                  {t('termsTimeStatus') || 'Tidsstatus (getTimeStatus)'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {t('termsTimeStatusText') || 'Beräknar om en uppgift är försenad eller närmar sig deadline:'}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
{`diffTime = endDate.getTime() - today.getTime()
diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

Om diffDays < 0:
  → isOverdue = true
  → isWarning = false

Om diffDays >= 0 OCH diffDays <= thresholdDays:
  → isOverdue = false
  → isWarning = true

Annars:
  → isOverdue = false
  → isWarning = false`}
                  </pre>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {t('termsTimeStatusNote') || 'Default threshold: 1 dag (DEFAULT_WARNING_THRESHOLD = 1)'}
                </p>
              </div>

              {/* Checklist Progress */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Code size={18} />
                  {t('termsChecklistProgress') || 'Checklist Framsteg (calculateChecklistProgress)'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {t('termsChecklistProgressText') || 'Beräknar framsteg i procent:'}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
{`done = checklist.filter(item => item.done === true).length
total = checklist.length
progress = Math.round((done / total) * 100)`}
                  </pre>
                </div>
              </div>

              {/* Zoom Levels */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Code size={18} />
                  {t('termsZoomLevels') || 'Zoom-nivåer (ZOOM_LEVELS)'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {t('termsZoomLevelsText') || 'Cellbredd per zoom-nivå:'}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
{`day: { cellWidth: 40 }
week: { cellWidth: 20 }
month: { cellWidth: 10 }`}
                  </pre>
                </div>
              </div>

              {/* Task Duration */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Code size={18} />
                  {t('termsTaskDuration') || 'Task Duration'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {t('termsTaskDurationText') || 'Beräknar varaktighet i dagar:'}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
{`durationTime = end.getTime() - start.getTime()
durationDays = Math.ceil(durationTime / (1000 * 60 * 60 * 24)) + 1

Milestone: durationDays <= 1 OCH start.getTime() === end.getTime()`}
                  </pre>
                </div>
              </div>

              {/* Red Days */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Code size={18} />
                  {t('termsRedDays') || 'Röda Dagar (isRedDay)'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {t('termsRedDaysText') || 'En dag är röd om den är:'}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
{`date.getDay() === 0 (Söndag) ELLER
date.getDay() === 6 (Lördag) ELLER
getHolidayName(date) !== null (helgdag)`}
                  </pre>
                </div>
              </div>

              {/* Priority Distribution */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Code size={18} />
                  {t('termsPriorityDistribution') || 'Prioritetsfördelning'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {t('termsPriorityDistributionText') || 'Räknar prioritetsfördelning från aktiva deluppgifter:'}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
{`1. Filtrera tasks:
   - Exkludera om task.deleted === true
   - Exkludera om checkIsDone(task.status) === true

2. För varje task, loopa checklist:
   - Exkludera om !isActiveSubtask(item)
   - Normalisera prioritet: normalizeSubtaskPriority(item)

3. Gruppera per normaliserad prioritet:
   - Räkna antal per "Hög", "Normal", "Låg"`}
                  </pre>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                  {t('termsPriorityDistributionNote') || 'OBS: Endast aktiva deluppgifter från icke-klara tasks räknas.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});

TermsView.displayName = 'TermsView';

