export type Language = 'en' | 'hi' | 'mr';

export interface Translations {
  appName: string;
  appSubtitle: string;
  demoDataNotice: string;
  lowResourceMode: string;
  connectedMode: string;
  modeDescription: string;
  
  // Navigation
  dashboard: string;
  animals: string;
  animalDetails: string;
  liveMonitoring: string;
  analytics: string;
  alerts: string;
  addData: string;
  milkData: string;
  cmtTests: string;
  healthRecords: string;
  udderAnalysis: string;
  devices: string;
  reports: string;
  farmMap: string;
  settings: string;
  profile: string;
  more: string;

  // Species
  cows: string;
  buffaloes: string;
  allSpecies: string;
  cow: string;
  buffalo: string;

  // Risk
  riskOverview: string;
  noRisk: string;
  lowRisk: string;
  moderateRisk: string;
  highRisk: string;
  riskScore: string;
  riskTrend: string;
  contributingFactors: string;
  explainability: string;
  topPriorityAnimals: string;

  // Metrics & Sensors
  herdOverview: string;
  totalAnimals: string;
  connectedDevices: string;
  activeAlerts: string;
  activity: string;
  movement: string;
  surfaceTemperature: string;
  aiInferredRumination: string;
  chewing: string;
  ambientTemperature: string;
  humidity: string;
  thi: string;
  milkYield: string;
  electricalConductivity: string;
  ph: string;
  scc: string;

  // Labels
  measured: string;
  estimated: string;
  aiInferred: string;

  // Actions
  quickActions: string;
  addAnimal: string;
  recordMilk: string;
  newCmtTest: string;
  addHealthRecord: string;
  viewAnalytics: string;
  acknowledge: string;
  review: string;
  resolve: string;
  viewAnimal: string;
  search: string;
  filter: string;
  save: string;
  cancel: string;
  delete: string;
  confirm: string;
  retry: string;

  // Scientific disclaimers
  scientificNotice: string;
  ruminationNote: string;
  tempNote: string;
  udderNote: string;
  sccNote: string;
  validationNote: string;
  vetDisclaimer: string;

  // Alerts
  alertPriority: string;
  critical: string;
  high: string;
  medium: string;
  low: string;
  recentAlerts: string;

  // CMT
  leftFront: string;
  rightFront: string;
  leftRear: string;
  rightRear: string;
  overallResult: string;

  // AI Signal UI (Phase 2)
  aiHealthSignals: string;
  model1Label: string;
  model1SubLabel: string;
  model1Disclaimer: string;
  model1Signal7d: string;
  model1Signal14d: string;
  model2Label: string;
  model2SubLabel: string;
  model3Label: string;
  model3SubLabel: string;
  signalElevated: string;
  signalBelowThreshold: string;
  signalInsufficient: string;
  signalInsufficientDetail: string;
  signalPending: string;
  behaviorNormal: string;
  behaviorMildDeviation: string;
  behaviorModerateDeviation: string;
  behaviorHighDeviation: string;
  provenanceManual: string;
  provenanceSensor: string;
  provenanceImported: string;
  provenanceAiModel: string;
  provenanceSynthetic: string;

  // Dashboard hardcoded strings (Phase 2 fix)
  priorityConfirmation: string;
  requireCmtExam: string;
  noElevatedSignal: string;
  lowSignalCount: string;
  deviceLocalBadge: string;
  lowBattery: string;
  rapidFieldEntry: string;
  viewAllAnimals: string;
  viewAllAlerts: string;
  aiSignalDistLive: string;
  aiSignalDistDemo: string;
  aiModelSignalLabel: string;
  aiModelSignalDesc: string;
  confirmatoryRequiredLabel: string;
  confirmatoryRequiredDesc: string;
  noActiveAlerts: string;
  noFarmConnected: string;
  appBannerSubtitle: string;
  computing: string;
  refreshSignalsBtn: string;
  demoDataLabel: string;
  liveLabel: string;

  // Navigation / page strings
  backToAnimals: string;
  returnToHerdList: string;
  animalNotFound: string;
  animalNotFoundDesc: string;
  couldNotLoadAnimal: string;
  sensorDataTab: string;
  milkTab: string;
  healthCmtTab: string;
  riskHistoryTab: string;
  sensorReadingHistory: string;
  mostRecentSensorData: string;
  refreshBtn: string;
  noSensorReadings: string;
  noMilkRecords: string;
  noCmtRecords: string;
  noHealthRecords: string;
  noSignalHistory: string;
  logMilking: string;
  newCmt: string;
  logTreatment: string;
  noFarmWarning: string;
  noFarmWarningAnimals: string;
  noFarmWarningAnalytics: string;
  noFarmWarningMonitoring: string;
  noAnimalsFound: string;
  noAnimalsFoundLive: string;
  noAnimalsFoundFilter: string;
  addAnimalsLink: string;
  loadingSensorData: string;
  noSignalAvailable: string;
  loadingRiskData: string;

  // AI Health Signals component strings
  currentScreeningSignal: string;
  ruleBasedEngineOutput: string;
  contributingFactorsLabel: string;
  allParamsNormal: string;
  recommendedActionLabel: string;
  temporalForecastingSignals: string;
  notYetIntegrated7d: string;
  notYetIntegrated14d: string;
  windowComputedLabel: string;
  imageStoredAt: string;
  cvAnalysisPending: string;
  correlateWithCmt: string;
  noUdderImageUploaded: string;
  udderUploadViaPage: string;
  udderImageDisclaimer: string;
  behaviorIndependentDisclaimer: string;
  independentSignalsNotice: string;
  refreshSignals: string;
  computingLabel: string;

  // Animal registration form
  animalPhotoLabel: string;
  animalPhotoHint: string;
  selectPhoto: string;
  removePhoto: string;
  replacePhoto: string;
  photoPreview: string;
  registerAnimalBtn: string;
  tagRfid: string;
  nameIdentifier: string;
  speciesLabel: string;
  breedLabel: string;
  ageYears: string;
  lactationNumber: string;
  daysInMilk: string;
  avgYield: string;
  collarId: string;
  farmShedCluster: string;
  baselineCalibrationNotice: string;

  // Common UI
  settingsLink: string;
  noFarmConnectedTitle: string;
  noFarmConnectedDesc: string;

  // Login / Register
  signInHeading: string;
  emailAddressLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  signingInLabel: string;
  signInBtn: string;
  newToGoDrishti: string;
  createAccountLink: string;
  backendLabel: string;
  errorEmailRequired: string;
  errorInvalidCredentials: string;
  errorCannotReachServer: string;
  errorLoginFailed: string;
  errorUnexpected: string;
  createAccountHeading: string;
  accountCreatedMsg: string;
  fullNameLabel: string;
  emailLabel: string;
  passwordPlaceholderMinChar: string;
  phoneOptionalLabel: string;
  roleLabel: string;
  roleFarmer: string;
  roleVet: string;
  roleAdmin: string;
  creatingAccountLabel: string;
  createAccountBtn: string;
  alreadyHaveAccount: string;
  signInLink: string;
  errorNameEmailRequired: string;
  errorPasswordTooShort: string;
  errorEmailExists: string;
  signOutBtn: string;

  // Alerts page
  alertsSubtitleLive: string;
  alertsSubtitleDemo: string;
  acknowledgeAllActive: string;
  alertsDemoNotice: string;
  filterSeverityLabel: string;
  filterStatusLabel: string;
  filterAll: string;
  statusOpen: string;
  statusAcknowledged: string;
  statusResolved: string;
  statusFalsePositive: string;
  foundAlertsCount: string;
  noAlertsFound: string;
  allVitalsNormal: string;
  animalIdLabel: string;
  markFalsePositive: string;
  noAlertsMatchCriteria: string;
  allVitalsAndNodesNormal: string;
  subjectLabel: string;

  // Analytics page
  analyticsSubtitleLive: string;
  analyticsSubtitleDemo: string;
  exportCsv: string;
  analyticsDemoNotice: string;
  selectAnimalLabel: string;
  loadingLabel: string;
  herdAverageOption: string;
  noSensorDataForAnimal: string;
  chartTitleSurfaceTemp: string;
  chartSubtitleSurfaceTemp: string;
  chartTitleRumination: string;
  chartSubtitleRumination: string;
  chartTitleActivity: string;
  chartSubtitleActivity: string;
  chartTitleRiskScoreLive: string;
  chartTitleRiskScoreDemo: string;
  chartSubtitleRiskLive: string;
  chartSubtitleRiskDemo: string;
  aiIndexBadge: string;
  chartTitleThi: string;
  chartSubtitleThi: string;

  // CMT page
  cmtSubtitle: string;
  filterLivestockLabel: string;
  allHerdRecordsOption: string;
  showingPaddleEvals: string;
  dateLabel: string;
  evaluatorLabel: string;
  paddleReadingsLabel: string;
  noteLabel: string;
  normalSomaticRange: string;
  suspectedSccElevation: string;
  cmtEmptyHint: string;

  // Devices page
  devicesSubtitle: string;
  devicesOnlineCount: string;
  assignedSubjectLabel: string;
  unassignedSpareNode: string;
  batteryChargeLabel: string;
  firmwareLabel: string;
  sensorsLabel: string;
  lastTelemetrySyncLabel: string;
  pingingLabel: string;
  pingNodeBtn: string;
  signalStrengthLabel: string;

  // FarmMap page
  farmMapSubtitle: string;
  indianDairyClusters: string;
  clickClusterHint: string;
  nationalTelemetryNetwork: string;
  simulatedGeoNodes: string;
  clusterProfileLabel: string;
  livestockCensusLabel: string;
  clusterMeanRiskLabel: string;
  priorityFlaggedHeadsLabel: string;
  barnClimateLabel: string;
  tempLabel: string;
  rhLabel: string;
  viewClusterAnimals: string;

  // Health Records page
  healthRecordsSubtitle: string;
  healthSearchPlaceholder: string;
  showingRecordsCount: string;
  physicalObservationsLabel: string;
  prescribedInterventionLabel: string;
  notesLabel: string;
  scheduledFollowUpLabel: string;
  healthEmptyHint: string;

  // Live Monitoring page
  monitoringSubtitleLive: string;
  monitoringSubtitleDemo: string;
  stopAutoRefresh: string;
  startAutoRefresh: string;
  pauseTelemetry: string;
  resumeStream: string;
  tickLabel: string;
  updatedAtLabel: string;
  filterAnimalLabel: string;
  allLivestockOption: string;
  legendMeasured: string;
  legendAiInferred: string;
  legendEstimated: string;
  noAnimalsForFarm: string;
  baselineLabel: string;
  sensorsStable: string;
  historicalGraphsLink: string;
  backendConnectedBadge: string;
  bleMeshBadge: string;
  activityRawLabel: string;
  awaitingData: string;
  sourceLabel: string;

  // Milk Data page
  milkDataSubtitle: string;
  submitsToBackend: string;
  milkDemoNotice: string;
  milkSearchPlaceholder: string;
  inlineEcPhMode: string;
  tableAnimal: string;
  tableDate: string;
  tableYield: string;
  tableMilkTemp: string;
  tableEc: string;
  tablePh: string;
  tableScc: string;
  tableNotes: string;
  tableActions: string;
  milkEmptyHint: string;

  // Profile page
  defaultUserName: string;
  architectureLabel: string;
  dairyEnterpriseLabel: string;
  facilityNameLabel: string;
  locationLabel: string;
  herdCapacityLabel: string;
  supervisingVetLabel: string;
  emergencyClinicLabel: string;
  systemIntelligenceLabel: string;
  platformArchLabel: string;
  modelPipelineLabel: string;
  clinicalScopeLabel: string;
  scientificValidationLabel: string;
  peerReviewedCompliant: string;
  hardwareVerificationLabel: string;
  acousticRuminationLabel: string;
  skinTemperatureLabel: string;
  affordableFieldScreeningLabel: string;

  // Reports page
  reportsSubtitle: string;
  printReportBtn: string;
  exportSummaryBtn: string;
  reportDocTitle: string;
  reportPeriodLabel: string;
  totalScreenedHerd: string;
  headsUnit: string;
  highMastitisRisk: string;
  moderateRiskWatch: string;
  biomarkerTrendDeviations: string;
  estMilkLossSaved: string;
  via7to14Detection: string;
  highPriorityTableTitle: string;
  tableTag: string;
  tableName: string;
  tableSpecies: string;
  tableRiskScore: string;
  tableDeviationFactors: string;
  tablePrescribedAction: string;
  action4QuarterCmt: string;
  actionObserveRumination: string;
  vetRecommendationsTitle: string;
  reportRecommendation1: string;
  reportRecommendation2: string;
  reportRecommendation3: string;
  reportFootnote: string;
  reportFootnoteRight: string;

  // Settings page
  settingsSubtitle: string;
  farmArchitectureTitle: string;
  farmArchitectureDesc: string;
  activeModeLabel: string;
  lowResourceModeDesc: string;
  recommendedRuralLabel: string;
  connectedModeDesc: string;
  recommendedCommercialLabel: string;
  uiLanguageTitle: string;
  langEnglish: string;
  langHindi: string;
  langMarathi: string;
  calibrationThresholdsTitle: string;
  calibrationThresholdsDesc: string;
  savedLabel: string;
  tempDeviationLimitLabel: string;
  alertIfDeltaHint: string;
  ruminationDropLabel: string;
  ruminationDropHint: string;
  thiThresholdLabel: string;
  thiThresholdHint: string;
  cowBaselineTempLabel: string;
  ds18b20CalibrationHint: string;
  buffaloBaselineTempLabel: string;
  resetToDefaultsBtn: string;
  saveCalibrationBtn: string;
  farmManagementTitle: string;
  farmManagementDesc: string;
  newFarmBtn: string;
  registerNewFarmTitle: string;
  farmNameLabel: string;
  farmNamePlaceholder: string;
  farmCodeLabel: string;
  farmCodePlaceholder: string;
  locationOptionalLabel: string;
  locationPlaceholder: string;
  createFarmBtn: string;
  loadingFarmsLabel: string;
  noFarmsRegistered: string;
  availableFarmsLabel: string;
  activeBadge: string;
  setActiveBtn: string;
  activeFarmIdLabel: string;
  resetDemoDataTitle: string;
  resetDemoDataDesc: string;
  resetAllDataBtn: string;

  // Udder Analysis page
  supportiveVisionBadge: string;
  backendUploadBadge: string;
  udderAnalysisSubtitle: string;
  animalLabel: string;
  udderStep1Title: string;
  changePhotoBtn: string;
  selectPhotoBtn: string;
  photoFormatHint: string;
  demoSampleLabel: string;
  uploadingToBackend: string;
  runningCvModel: string;
  uploadUdderImageBtn: string;
  analyzeUdderImageBtn: string;
  selectFileHint: string;
  udderStep2Title: string;
  imageUploadedMsg: string;
  storedAtLabel: string;
  supportiveVisualAssessment: string;
  cvModelLabel: string;
  capturedLabel: string;
  requiresFollowUp: string;
  viewAnimalProfileLink: string;
  newScanBtn: string;
  morphologicalRiskLabel: string;
  confidenceLabel: string;
  cvObservationsLabel: string;
  recommendedProtocolLabel: string;
  attachToProfileLink: string;
  noScanYet: string;
  noScanHint: string;

  // Sidebar / Header / MoreDrawer
  activeModeShort: string;
  lowResourceModeShort: string;
  connectedModeShort: string;
  livestockHealthGuard: string;
  sidebarFooterDisclaimer: string;
  selectFarmArchitecture: string;
  farmArchitectureAdaptDesc: string;
  lowResourceModeShortDesc: string;
  connectedModeShortDesc: string;
  moreDrawerSubtitle: string;
  modeLabel: string;
  descLiveMonitoring: string;
  descAnalytics: string;
  descAddData: string;
  descMilkData: string;
  descCmtTests: string;
  descHealthRecords: string;
  descUdderAnalysis: string;
  descDevices: string;
  descReports: string;
  descFarmMap: string;
  descSettings: string;
  descProfile: string;

  // ScientificDisclaimer
  clinicalProtocolsBadge: string;
  sectionRumination: string;
  sectionSurfaceTemp: string;
  sectionUdderScan: string;
  sectionSccData: string;
  sectionScope: string;
  sectionDecisionSupport: string;

  // AI Health Signals extra
  computedLabel: string;
  scoreLabel: string;
  behaviorPendingDesc: string;
  observationWindowLabel: string;

  // Dashboard extra
  openAlertsLabel: string;
  avgHerdYield: string;
  moderateRiskAnimals: string;
  runCmt: string;
  scanUdder: string;
  aiContributingFactors: string;
  fromBackendSorted: string;
  rankedByRisk: string;
  lowResourceSmallholder: string;
  connectedMultiSensor: string;
  totalLabel: string;
  retryBtn: string;

  // Animals page
  profileAndRisk: string;
  profileAndLiveData: string;
  ageLabel: string;
  lactationLabel: string;
  statusLabel: string;
  mastitisHxLabel: string;
  collarLabel: string;
  riskDriversLabel: string;
  showingAnimals: string;
  ofLabel: string;
  allRiskLevels: string;
  allSpeciesCowsOnly: string;
  allSpeciesBuffaloOnly: string;
  herdRegistryDesc: string;
  liveBackendDesc: string;
  searchTagBreedPlaceholder: string;
  refreshLabel: string;
  viewLabel: string;
  breedNotSpecified: string;
  tagIdLabel: string;

  // AnimalDetails
  recordCmtBtn: string;
  logMilkBtn: string;
  udderScanBtn: string;
  confirmatoryProtocol: string;
  cmtPaddleCheck: string;
  checkRearQuarters: string;
  antisepticDip: string;
  baselineSkinTempLabel: string;
  baselineRuminationLabel: string;
  baselineActivityLabel: string;
  avgDailyMilkLabel: string;
  liveIotSensors: string;
  milkingRecordsTitle: string;
  cmtHistoryTitle: string;
  vetNotesTitle: string;
  logTreatmentBtn: string;
  observationLabel: string;
  treatmentLabel: string;
  vetLabel: string;
  followUpLabel: string;
  computeRiskBtn: string;
  forecastLabel: string;
  riskScoreHistoryTitle: string;
  screeningEventTimeline: string;
  earlyRiskScoreLabel: string;
  collarAttachedLabel: string;
  liveTelemetryBadge: string;
  barnThi: string;
  ambientTemp: string;
  humidityLabel: string;
  dimLabel: string;
  unknown: string;
  notPaired: string;
  yesLabel: string;
  noLabel: string;

  // Analytics extra
  surfaceTempLabel: string;
  aiRuminationLabel: string;
  activityRawShort: string;
  rangeAffectsFetch: string;
  loadingBackendSensor: string;

  // Alerts extra
  reviewBtn: string;
  demoDataBadge: string;
  noFarmAlertData: string;
  foundLabel: string;
  severityLabel: string;

  // AddData page
  addDataSubtitle: string;
  registerLivestockTitle: string;
  registerLivestockDesc: string;
  registerLivestockBadge: string;
  milkingRecordQualityTitle: string;
  milkingRecordQualityDesc: string;
  milkingRecordBadge: string;
  cmtTestTitle: string;
  cmtTestDesc: string;
  cmtTestBadge: string;
  vetLogTitle: string;
  vetLogDesc: string;
  vetLogBadge: string;
  udderAsymmetryTitle: string;
  udderAsymmetryDesc: string;
  aiVisionBadge: string;
  launchCameraBtn: string;
  openFormBtn: string;
  bestFieldPracticesTitle: string;
  stripCupTitle: string;
  stripCupDesc: string;
  cmtPaddleStepTitle: string;
  cmtPaddleStepDesc: string;
  postMilkingDipTitle: string;
  postMilkingDipDesc: string;

  // MilkData page
  showingRecords: string;
  deleteMilkConfirm: string;
  milkDeletedToast: string;
  noMilkFoundTitle: string;
  clickToRecordMilk: string;
  lowResourceModeTag: string;

  // CMT page
  showingLabel: string;
  deleteCmtConfirm: string;
  cmtDeletedToast: string;
  noCmtFoundTitle: string;

  // HealthRecords page
  deleteHealthConfirm: string;
  healthDeletedToast: string;
  noHealthFoundTitle: string;
  clickLogVet: string;
  subjectLabel2: string;

  // LiveMonitoring extra
  noSensorDataAnimal: string;

  // UdderAnalysis extra
  sciConstraintTitle: string;
  sciConstraintDesc: string;
  liveInfoDesc: string;
  cvAnalysisPendingDesc: string;
  possibleSwelling: string;
  possibleRedness: string;
  visibleAsymmetry: string;
  cvConfidence: string;
  cvLesions: string;
  cvDischarge: string;
  statusProcessed: string;
  requiresFollowUpTitle: string;
  pleaseUploadPhoto: string;
  pleaseSelectAnimal: string;

  // Devices extra
  onlineOutOf: string;
  signalConnected: string;
  signalWeak: string;

  // FarmMap extra
  coopHubsMapped: string;
  farmMapGeographicDesc: string;
  headsLabel: string;

  // Reports extra
  requireCmtConfirmation: string;
  cowsLabel: string;
  buffaloesPluralLabel: string;
  generatedOn: string;
  auditId: string;
  farmClusterName: string;
  farmClusterLocation: string;

  // Settings extra
  activeColonLabel: string;
  uniqueShortId: string;
  connectedToApi: string;
  calibrationSavedToast: string;
  calibrationResetToast: string;
  demoDataResetToast: string;
  farmCreatedToast: string;
  activeFarmUpdatedToast: string;
  languageSetToast: string;
  resetDemoConfirm: string;
  farmNameCodeRequired: string;
  failedCreateFarm: string;
  farmCreatedMsg: string;

  // Profile extra
  lowResourceModeValue: string;
  connectedModeValue: string;
  goDrishtiUser: string;
  profileSubtitle: string;

  // Modal form labels
  selectAnimalModalLabel: string;
  backendLabel2: string;
  loadingAnimalsLabel: string;
  noBackendAnimalsMsg: string;
  dataSourceLabel: string;
  farmerObservation: string;
  fieldKitPaddle: string;
  labSubmission: string;
  veterinaryClinic: string;
  milkingDateLabel: string;
  milkYieldLabel: string;
  milkTempCLabel: string;
  electricalCondLabel: string;
  electricalCondHint: string;
  milkPhLabel: string;
  milkPhHint: string;
  sccCellsLabel: string;
  sccNotMeasured: string;
  visualObsLabel: string;
  saveMilkDataBtn: string;
  testDateLabel: string;
  cmtPaddleReadingsLabel: string;
  testerNameLabel: string;
  fieldNotesLabel: string;
  saveCmtRecordBtn: string;
  physicalObservationLabel: string;
  suspectedConditionLabel: string;
  treatmentInterventionLabel: string;
  vetNotesModalLabel: string;
  vetParavetLabel: string;
  followUpDateLabel: string;
  udderTempLabel: string;
  saveHealthRecordBtn: string;
  registerNewLivestockTitle: string;
  recordMilkQualityTitle: string;
  cmtFourQuarterTitle: string;
  vetObsTreatmentTitle: string;
  savesToBackendBadge: string;
  demoLocalBadge: string;
  farmLinkedMsg: string;
  baselineNotice: string;
  registerAnimalBtn2: string;
  healthyLabel: string;
  investigateLabel: string;
  clearLabel: string;
  precipitateLabel: string;
  gelLabel: string;

  // Toast messages
  toastAlertAcknowledged: string;
  toastAlertResolved: string;
  toastFailedAcknowledge: string;
  toastFailedResolve: string;
  toastDashboardRefreshed: string;
  toastRiskComputed: string;
  toastFailedRisk: string;
  toastAnimalRegistered: string;
  toastFailedRegister: string;
  toastMilkSaved: string;
  toastFailedMilkSave: string;
  toastCmtSaved: string;
  toastFailedCmtSave: string;
  toastHealthSaved: string;
  toastFailedHealthSave: string;
  toastSwitchedConnected: string;
  toastSwitchedLowResource: string;
  toastDevicePingSuccess: string;
  toastDeviceStatus: string;
  toastReportDownloaded: string;
  toastAnalyticsCsvLive: string;
  toastAnalyticsCsvDemo: string;
  toastUdderUploaded: string;
  toastUdderAssessed: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'GoDrishti',
    appSubtitle: 'AI Dairy Livestock Health Intelligence',
    demoDataNotice: 'DEMO DATA — Continuous herd telemetry & validation',
    lowResourceMode: 'Low-Resource Mode',
    connectedMode: 'Connected Farm Mode',
    modeDescription: 'Optimized for smallholder Indian farms with collars, phone & CMT',
    
    dashboard: 'Dashboard',
    animals: 'Animals',
    animalDetails: 'Animal Profile',
    liveMonitoring: 'Live Monitoring',
    analytics: 'Analytics',
    alerts: 'Alerts',
    addData: 'Add Data',
    milkData: 'Milk Data',
    cmtTests: 'CMT Tests',
    healthRecords: 'Health Records',
    udderAnalysis: 'Udder Analysis',
    devices: 'Devices',
    reports: 'Reports',
    farmMap: 'Farm Map / GIS',
    settings: 'Settings',
    profile: 'Profile',
    more: 'More Options',

    cows: 'Cows',
    buffaloes: 'Buffaloes',
    allSpecies: 'All Species',
    cow: 'Cow',
    buffalo: 'Buffalo',

    riskOverview: 'Risk Screening Overview',
    noRisk: 'Below Alert Threshold',
    lowRisk: 'Low Risk (26–50)',
    moderateRisk: 'Moderate Risk (51–75)',
    highRisk: 'High Risk (76–100)',
    riskScore: 'Risk Score',
    riskTrend: 'Risk Trend',
    contributingFactors: 'Contributing Biomarkers & Deviations',
    explainability: 'Explainable AI Factor Breakdown',
    topPriorityAnimals: 'Priority Animals Requiring Confirmation',

    herdOverview: 'Herd Overview',
    totalAnimals: 'Total Livestock',
    connectedDevices: 'Active IoT Collars',
    activeAlerts: 'Active Warnings',
    activity: 'Activity Index',
    movement: 'Neck Movement',
    surfaceTemperature: 'Surface Skin Temp',
    aiInferredRumination: 'AI-Inferred Rumination',
    chewing: 'Chewing Acoustics',
    ambientTemperature: 'Ambient Temp',
    humidity: 'Barn Humidity',
    thi: 'THI (Heat Stress)',
    milkYield: 'Milk Yield (L)',
    electricalConductivity: 'Electrical Cond.',
    ph: 'Milk pH',
    scc: 'SCC (Lab / Rapid)',

    measured: 'Measured',
    estimated: 'Estimated',
    aiInferred: 'AI-Inferred',

    quickActions: 'Quick Operational Actions',
    addAnimal: 'Register Animal',
    recordMilk: 'Add Milk Data',
    newCmtTest: 'Record CMT Test',
    addHealthRecord: 'Log Health Record',
    viewAnalytics: 'View Analytics',
    acknowledge: 'Acknowledge',
    review: 'Review Case',
    resolve: 'Mark Resolved',
    viewAnimal: 'View Animal',
    search: 'Search tag, name or breed...',
    filter: 'Filter',
    save: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm Action',
    retry: 'Try Again',

    scientificNotice: 'Scientific & Clinical Evidence Guidelines',
    ruminationNote: 'Collar MAX9814 captures acoustic patterns; AI infers rumination from chewing sounds.',
    tempNote: 'DS18B20 records surface/skin temperature, distinct from core rectal temperature.',
    udderNote: 'Udder visual scan is a supporting multimodal feature, not a standalone diagnostic.',
    sccNote: 'SCC values are manually logged or imported from certified lab/rapid tests.',
    validationNote: 'Model is designed for 7–14 day predictive screening and requires ongoing longitudinal validation.',
    vetDisclaimer: 'GoDrishti provides early screening and decision support; it does not replace veterinarians or clinical diagnosis.',

    alertPriority: 'Priority',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    recentAlerts: 'Recent Early-Warning Alerts',

    leftFront: 'Left Front (LF)',
    rightFront: 'Right Front (RF)',
    leftRear: 'Left Rear (LR)',
    rightRear: 'Right Rear (RR)',
    overallResult: 'Overall CMT Assessment',

    // AI Signal UI
    aiHealthSignals: 'AI Health Signals',
    model1Label: 'Model 1 — Mastitis Forecasting',
    model1SubLabel: 'Rule-based screening engine',
    model1Disclaimer: 'Development model — prospective clinical validation required.',
    model1Signal7d: '7-Day Forecasting Signal',
    model1Signal14d: '14-Day Forecasting Signal',
    model2Label: 'Model 2 — Udder Image AI',
    model2SubLabel: 'Visual assessment support',
    model3Label: 'Model 3 — Behavior Signal',
    model3SubLabel: 'Rumination & activity deviation',
    signalElevated: 'Elevated',
    signalBelowThreshold: 'Below Alert Threshold',
    signalInsufficient: 'Insufficient Data',
    signalInsufficientDetail: 'More recent historical observations are required before forecasting can be calculated.',
    signalPending: 'Integration Pending',
    behaviorNormal: 'Normal',
    behaviorMildDeviation: 'Mild Deviation',
    behaviorModerateDeviation: 'Moderate Deviation',
    behaviorHighDeviation: 'High Deviation',
    provenanceManual: 'Manual',
    provenanceSensor: 'Sensor',
    provenanceImported: 'Imported',
    provenanceAiModel: 'AI Model',
    provenanceSynthetic: 'Synthetic Development Data',

    // Dashboard
    priorityConfirmation: 'Priority Confirmation',
    requireCmtExam: 'Require CMT / Exam',
    noElevatedSignal: 'No elevated signal',
    lowSignalCount: 'Low signal',
    deviceLocalBadge: 'Device-local',
    lowBattery: 'Low Battery',
    rapidFieldEntry: 'Rapid field entry & diagnostics',
    viewAllAnimals: 'View All Animals',
    viewAllAlerts: 'View All Alerts',
    aiSignalDistLive: 'AI screening signal distribution (backend)',
    aiSignalDistDemo: 'AI screening signal distribution — not a diagnosis',
    aiModelSignalLabel: 'A — AI Model Signal',
    aiModelSignalDesc: 'Rule-based screening engine output. Not a diagnosis.',
    confirmatoryRequiredLabel: 'B — Confirmatory Required',
    confirmatoryRequiredDesc: 'CMT, SCC, or veterinary examination needed to confirm.',
    noActiveAlerts: 'No active alerts at this time.',
    noFarmConnected: 'No farm connected. Contact your admin or go to Settings to assign a farm.',
    appBannerSubtitle: 'Multimodal Early-Risk Screening for Bovine Mastitis — AI signal only, not a diagnosis.',
    computing: 'Computing…',
    refreshSignalsBtn: 'Run Risk Engine (All Animals)',
    demoDataLabel: 'DEMO DATA',
    liveLabel: 'LIVE',

    // Navigation / page strings
    backToAnimals: 'Back to Animals',
    returnToHerdList: 'Return to Herd List',
    animalNotFound: 'Animal Not Found',
    animalNotFoundDesc: 'The requested livestock profile does not exist.',
    couldNotLoadAnimal: 'Could not load animal',
    sensorDataTab: 'Sensor Data',
    milkTab: 'Milk',
    healthCmtTab: 'Health & CMT',
    riskHistoryTab: 'Signal History',
    sensorReadingHistory: 'Sensor Reading History',
    mostRecentSensorData: 'Most recent collar + barn sensor data',
    refreshBtn: 'Refresh',
    noSensorReadings: 'No sensor readings available yet. Sensor data arrives via collar ingestion.',
    noMilkRecords: 'No milk records logged yet.',
    noCmtRecords: 'No CMT records yet.',
    noHealthRecords: 'No health records yet.',
    noSignalHistory: 'No signal history available yet.',
    logMilking: 'Log Milking',
    newCmt: 'New CMT',
    logTreatment: 'Log Treatment',
    noFarmWarning: 'No farm connected. Contact your admin or go to Settings to assign a farm.',
    noFarmWarningAnimals: 'No farm assigned. Contact your admin or go to Settings to assign a farm.',
    noFarmWarningAnalytics: 'No farm connected. Assign a farm to view live analytics.',
    noFarmWarningMonitoring: 'No farm assigned. Sensor data requires a connected farm account.',
    noAnimalsFound: 'No animals found.',
    noAnimalsFoundLive: 'No animals registered for this farm yet.',
    noAnimalsFoundFilter: 'Try adjusting filters.',
    addAnimalsLink: 'Add animals →',
    loadingSensorData: 'Loading backend sensor data…',
    noSignalAvailable: 'No signal data available yet.',
    loadingRiskData: 'Loading risk data…',

    // AI Health Signals
    currentScreeningSignal: 'Current Screening Signal',
    ruleBasedEngineOutput: 'Rule-based engine output',
    contributingFactorsLabel: 'Contributing factors',
    allParamsNormal: 'All parameters within normal limits.',
    recommendedActionLabel: 'Recommended action',
    temporalForecastingSignals: 'Temporal Forecasting Signals',
    notYetIntegrated7d: 'gorakshak_forecast_7d_xgb_v2 — not yet integrated',
    notYetIntegrated14d: 'gorakshak_forecast_14d_xgb_v2 — not yet integrated',
    windowComputedLabel: 'Window',
    imageStoredAt: 'Image stored at',
    cvAnalysisPending: 'CV analysis will appear once Model 2 is connected.',
    correlateWithCmt: 'Always correlate with CMT or veterinary SCC analysis.',
    noUdderImageUploaded: 'No udder image has been uploaded for this animal yet, or Model 2 is not yet connected.',
    udderUploadViaPage: 'Upload an image via the Udder Analysis page.',
    udderImageDisclaimer: 'Udder image assessment is supportive only — not a standalone veterinary diagnosis. Correlate with physical examination and CMT.',
    behaviorIndependentDisclaimer: 'Behavior signal is an independent observation. It does not represent mastitis probability.',
    independentSignalsNotice: 'The three signals below are independent. They are not averaged and do not combine into a single diagnosis probability.',
    refreshSignals: 'Refresh Signals',
    computingLabel: 'Computing…',

    // Animal registration form
    animalPhotoLabel: 'Animal Photo',
    animalPhotoHint: 'Upload a photo of the animal for identification (optional)',
    selectPhoto: 'Select Photo',
    removePhoto: 'Remove Photo',
    replacePhoto: 'Change Photo',
    photoPreview: 'Photo Preview',
    registerAnimalBtn: 'Register Animal',
    tagRfid: 'Tag / RFID *',
    nameIdentifier: 'Name / Identifier *',
    speciesLabel: 'Species *',
    breedLabel: 'Breed *',
    ageYears: 'Age (Years)',
    lactationNumber: 'Lactation #',
    daysInMilk: 'Days In Milk',
    avgYield: 'Avg Yield (L/day)',
    collarId: 'Smart Collar ID',
    farmShedCluster: 'Farm / Shed Cluster',
    baselineCalibrationNotice: 'Baseline values for DS18B20 skin temperature and MAX9814 acoustic rumination will calibrate across the first 7 days.',

    // Common UI
    settingsLink: 'Settings',
    noFarmConnectedTitle: 'No farm connected',
    noFarmConnectedDesc: 'Your account has no farm assigned yet. Visit Settings or contact your admin to assign a farm.',

    // Login / Register
    signInHeading: 'Sign in to your account',
    emailAddressLabel: 'Email Address',
    emailPlaceholder: 'farmer@vaishnavidairy.in',
    passwordLabel: 'Password',
    signingInLabel: 'Signing in…',
    signInBtn: 'Sign In',
    newToGoDrishti: 'New to GoDrishti?',
    createAccountLink: 'Create an account',
    backendLabel: 'Backend',
    errorEmailRequired: 'Email and password are required.',
    errorInvalidCredentials: 'Invalid email or password.',
    errorCannotReachServer: 'Cannot reach server. Check VITE_API_BASE_URL and backend status.',
    errorLoginFailed: 'Login failed. Please try again.',
    errorUnexpected: 'Unexpected error. Please try again.',
    createAccountHeading: 'Create Account',
    accountCreatedMsg: 'Account created! Redirecting to login…',
    fullNameLabel: 'Full Name *',
    emailLabel: 'Email *',
    passwordPlaceholderMinChar: 'min. 6 characters',
    phoneOptionalLabel: 'Phone (optional)',
    roleLabel: 'Role',
    roleFarmer: 'Farmer',
    roleVet: 'Veterinarian',
    roleAdmin: 'Admin',
    creatingAccountLabel: 'Creating account…',
    createAccountBtn: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    signInLink: 'Sign in',
    errorNameEmailRequired: 'Name, email, and password are required.',
    errorPasswordTooShort: 'Password must be at least 6 characters.',
    errorEmailExists: 'An account with this email already exists.',
    signOutBtn: 'Sign Out',

    // Alerts page
    alertsSubtitleLive: 'Real-time alerts from backend risk engine',
    alertsSubtitleDemo: 'Automated notifications for early biomarker deviations',
    acknowledgeAllActive: 'Acknowledge All Active',
    alertsDemoNotice: 'Alerts are from local demo storage. Connect backend to see real risk-engine alerts.',
    filterSeverityLabel: 'Severity',
    filterStatusLabel: 'Status',
    filterAll: 'All',
    statusOpen: 'Open',
    statusAcknowledged: 'Acknowledged',
    statusResolved: 'Resolved',
    statusFalsePositive: 'False Positive',
    foundAlertsCount: 'alerts found',
    noAlertsFound: 'No alerts found.',
    allVitalsNormal: 'All herd vitals operating normally.',
    animalIdLabel: 'Animal ID',
    markFalsePositive: 'False Positive',
    noAlertsMatchCriteria: 'No alerts matching criteria.',
    allVitalsAndNodesNormal: 'All herd vitals and collar nodes operating normally.',
    subjectLabel: 'Subject',

    // Analytics page
    analyticsSubtitleLive: 'Live backend sensor trends · Surface temp, rumination, activity, THI & risk scores',
    analyticsSubtitleDemo: 'Multi-biomarker forecasting trends · Demo data',
    exportCsv: 'Export CSV',
    analyticsDemoNotice: 'Charts use static mock arrays. Set VITE_DEMO_MODE=false to show real backend sensor trends.',
    selectAnimalLabel: 'Select Animal',
    loadingLabel: 'Loading…',
    herdAverageOption: 'Herd Average',
    noSensorDataForAnimal: 'No sensor data yet for this animal.',
    chartTitleSurfaceTemp: 'Skin Surface Temperature vs Ambient',
    chartSubtitleSurfaceTemp: 'DS18B20 skin probe vs SHT31-D barn node (°C)',
    chartTitleRumination: 'AI-Inferred Rumination (min/day)',
    chartSubtitleRumination: 'Inferred from MAX9814 chewing acoustics',
    chartTitleActivity: 'Activity / Neck Motion Index',
    chartSubtitleActivity: 'MPU6050 accelerometer raw movement score',
    chartTitleRiskScoreLive: 'Risk Score History (0–100)',
    chartTitleRiskScoreDemo: 'Continuous Herd Early-Risk Trend (0–100)',
    chartSubtitleRiskLive: 'Backend risk engine output per computation run',
    chartSubtitleRiskDemo: 'Composite multimodal risk index trajectory',
    aiIndexBadge: 'AI Index',
    chartTitleThi: 'Barn THI (Temperature-Humidity Index)',
    chartSubtitleThi: 'Computed from SHT31-D ambient node — stress thresholds: moderate >68, high >72',

    // CMT page
    cmtSubtitle: 'California Mastitis Test (CMT) 4-quarter paddle gelation screening & somatic cell estimation',
    filterLivestockLabel: 'Filter Livestock',
    allHerdRecordsOption: 'All Herd Records',
    showingPaddleEvals: 'paddle evaluations',
    dateLabel: 'Date',
    evaluatorLabel: 'Evaluator',
    paddleReadingsLabel: '4-Quarter Paddle Readings',
    noteLabel: 'Note',
    normalSomaticRange: 'Normal somatic cellular range',
    suspectedSccElevation: 'Suspected somatic cell elevation',
    cmtEmptyHint: 'Click "Record CMT Test" to evaluate a cow or buffalo.',

    // Devices page
    devicesSubtitle: 'IoT smart collar nodes (MPU6050, DS18B20, MAX9814) & SHT31-D ambient barn telemetry',
    devicesOnlineCount: 'Online',
    assignedSubjectLabel: 'Assigned Subject',
    unassignedSpareNode: 'Unassigned (Spare Node)',
    batteryChargeLabel: 'Battery Charge',
    firmwareLabel: 'Firmware',
    sensorsLabel: 'Sensors',
    lastTelemetrySyncLabel: 'Last Telemetry Sync',
    pingingLabel: 'Pinging...',
    pingNodeBtn: 'Ping Node',
    signalStrengthLabel: 'Signal',

    // FarmMap page
    farmMapSubtitle: 'Geographic herd risk visualization, regional heat stress (THI) & shed clusters',
    indianDairyClusters: 'Indian Dairy Farm Clusters',
    clickClusterHint: 'Click a cluster node to view telemetry',
    nationalTelemetryNetwork: 'National Dairy Telemetry Network',
    simulatedGeoNodes: 'Simulated Geo-Nodes',
    clusterProfileLabel: 'Cluster Profile',
    livestockCensusLabel: 'Livestock Census',
    clusterMeanRiskLabel: 'Cluster Mean Risk',
    priorityFlaggedHeadsLabel: 'Priority Flagged Heads',
    barnClimateLabel: 'Barn Climate (SHT31-D)',
    tempLabel: 'Temp',
    rhLabel: 'RH',
    viewClusterAnimals: 'View Cluster Animals',

    // Health Records page
    healthRecordsSubtitle: 'Clinical veterinary diagnoses, physical teat examinations, antibiotic treatments & barrier dips',
    healthSearchPlaceholder: 'Search by animal, condition, medication...',
    showingRecordsCount: 'records',
    physicalObservationsLabel: 'Physical Signs & Observations',
    prescribedInterventionLabel: 'Prescribed Intervention & Protocol',
    notesLabel: 'Notes',
    scheduledFollowUpLabel: 'Scheduled Follow-Up Re-screening',
    healthEmptyHint: 'Click "Log Veterinary Treatment" to register a clinical observation.',

    // Live Monitoring page
    monitoringSubtitleLive: 'Showing latest sensor readings from backend — refresh interval: 30s',
    monitoringSubtitleDemo: 'Streaming from MPU6050, DS18B20, MAX9814 collar nodes and SHT31-D barn units',
    stopAutoRefresh: 'Stop Auto-Refresh',
    startAutoRefresh: 'Auto-Refresh (30s)',
    pauseTelemetry: 'Pause Telemetry',
    resumeStream: 'Resume Stream',
    tickLabel: 'Tick',
    updatedAtLabel: 'Updated',
    filterAnimalLabel: 'Filter Animal',
    allLivestockOption: 'All Live Livestock',
    legendMeasured: 'Measured (Physical Sensor)',
    legendAiInferred: 'AI-Inferred (Acoustic)',
    legendEstimated: 'Estimated (THI Index)',
    noAnimalsForFarm: 'No animals found for this farm.',
    baselineLabel: 'Baseline',
    sensorsStable: 'Sensors stable',
    historicalGraphsLink: 'Historical Graphs →',
    backendConnectedBadge: 'Backend Connected',
    bleMeshBadge: 'ESP32 / BLE Mesh',
    activityRawLabel: 'Activity Raw',
    awaitingData: 'Awaiting data',
    sourceLabel: 'Source',

    // Milk Data page
    milkDataSubtitle: 'Milking volume yields, milk temperature, EC, pH and laboratory SCC',
    submitsToBackend: 'Submits to Backend',
    milkDemoNotice: 'Records are stored locally. In live mode, data submits to /api/v1/ingest/manual-lab.',
    milkSearchPlaceholder: 'Search by animal tag, date, notes…',
    inlineEcPhMode: 'In-line EC/pH Mode',
    tableAnimal: 'Animal',
    tableDate: 'Date',
    tableYield: 'Yield (L)',
    tableMilkTemp: 'Milk Temp',
    tableEc: 'EC (mS/cm)',
    tablePh: 'pH',
    tableScc: 'SCC (×10³)',
    tableNotes: 'Notes',
    tableActions: 'Actions',
    milkEmptyHint: 'Click "Record Milking" to log daily yields.',

    // Profile page
    defaultUserName: 'GoDrishti User',
    architectureLabel: 'Architecture',
    dairyEnterpriseLabel: 'Dairy Enterprise & Infrastructure',
    facilityNameLabel: 'Facility Name',
    locationLabel: 'Location',
    herdCapacityLabel: 'Lactating Herd Capacity',
    supervisingVetLabel: 'Supervising Veterinarian',
    emergencyClinicLabel: 'Emergency Animal Clinic',
    systemIntelligenceLabel: 'System Intelligence & Model Certification',
    platformArchLabel: 'Platform Architecture',
    modelPipelineLabel: 'Model Pipeline',
    clinicalScopeLabel: 'Target Clinical Scope',
    scientificValidationLabel: 'Scientific Validation',
    peerReviewedCompliant: 'Peer-Reviewed Constraints Compliant',
    hardwareVerificationLabel: 'Multimodal Hardware & Biological Model Verification',
    acousticRuminationLabel: 'Acoustic Rumination',
    skinTemperatureLabel: 'Skin Temperature',
    affordableFieldScreeningLabel: 'Affordable Field Screening',

    // Reports page
    reportsSubtitle: 'Monthly bovine mastitis early-screening summary & economic impact audit',
    printReportBtn: 'Print Report',
    exportSummaryBtn: 'Export Summary',
    reportDocTitle: 'Dairy Livestock Mastitis Early-Forecasting Comprehensive Report',
    reportPeriodLabel: 'Target Period: Current Lactation Cycle • Generated on',
    totalScreenedHerd: 'Total Screened Herd',
    headsUnit: 'heads',
    highMastitisRisk: 'High Mastitis Risk',
    moderateRiskWatch: 'Moderate Risk Watch',
    biomarkerTrendDeviations: 'Biomarker Trend Deviations',
    estMilkLossSaved: 'Est. Milk Loss Saved',
    via7to14Detection: 'Via 7–14d Early Detection',
    highPriorityTableTitle: 'High Priority Animals Flagged by Multimodal Engine',
    tableTag: 'Tag',
    tableName: 'Name',
    tableSpecies: 'Species',
    tableRiskScore: 'Risk Score',
    tableDeviationFactors: 'Primary Deviation Factors',
    tablePrescribedAction: 'Prescribed Action',
    action4QuarterCmt: 'Perform 4-quarter CMT',
    actionObserveRumination: 'Observe rumination',
    vetRecommendationsTitle: 'Veterinary Action Recommendations for Farm Supervisor',
    reportRecommendation1: 'Isolate priority heads during evening milking to avoid cross-contamination of milking clusters.',
    reportRecommendation2: 'Verify collar fitment for animals showing sudden acoustic drops to eliminate loose sensor artifact.',
    reportRecommendation3: 'Implement post-milking barrier antiseptic dips across all lactating animals during high THI periods.',
    reportFootnote: '* Generated by GoDrishti AI Engine • Verified against field CMT protocols',
    reportFootnoteRight: 'Livestock Health Intelligence System',

    // Settings page
    settingsSubtitle: 'Farm architecture, sensor calibration, language preferences and farm management',
    farmArchitectureTitle: 'Farm Operating Architecture',
    farmArchitectureDesc: 'Select whether the dairy uses automated parlour sensors or low-resource field equipment',
    activeModeLabel: 'Active',
    lowResourceModeDesc: 'Collar acoustic inferencing, physical teat observations, and 4-quarter CMT paddles. Omits in-line EC/pH or lab SCC.',
    recommendedRuralLabel: 'Recommended for rural clusters',
    connectedModeDesc: 'Full-stack IoT + automated milking parlour. Activates continuous in-line EC, pH probe streams, and lab SCC synchronization.',
    recommendedCommercialLabel: 'For commercial farms & research herds',
    uiLanguageTitle: 'User Interface Language',
    langEnglish: 'English',
    langHindi: 'Hindi',
    langMarathi: 'Marathi',
    calibrationThresholdsTitle: 'Biomarker Calibration Thresholds',
    calibrationThresholdsDesc: 'Adjust mastitis early-risk sensitivity offsets · Saved to device localStorage',
    savedLabel: 'Saved',
    tempDeviationLimitLabel: 'Skin Temp Deviation Limit (°C)',
    alertIfDeltaHint: 'Alert if Δ > this value',
    ruminationDropLabel: 'Rumination Acoustic Drop (%)',
    ruminationDropHint: 'Drop below 7-day moving avg',
    thiThresholdLabel: 'THI Heat Stress Threshold',
    thiThresholdHint: 'Standard bovine stress: ≥ 79',
    cowBaselineTempLabel: 'Indigenous Cow Baseline Temp (°C)',
    ds18b20CalibrationHint: 'DS18B20 skin calibration',
    buffaloBaselineTempLabel: 'Buffalo Baseline Temp (°C)',
    resetToDefaultsBtn: 'Reset to Defaults',
    saveCalibrationBtn: 'Save Calibration',
    farmManagementTitle: 'Farm Management',
    farmManagementDesc: 'Create and select farms',
    newFarmBtn: 'New Farm',
    registerNewFarmTitle: 'Register New Farm',
    farmNameLabel: 'Farm Name *',
    farmNamePlaceholder: 'e.g. Vaishanavi Dairy',
    farmCodeLabel: 'Farm Code *',
    farmCodePlaceholder: 'e.g. F01',
    locationOptionalLabel: 'Location (optional)',
    locationPlaceholder: 'e.g. Anand, Gujarat, India',
    createFarmBtn: 'Create Farm',
    loadingFarmsLabel: 'Loading farms from backend…',
    noFarmsRegistered: 'No farms registered yet. Create one above.',
    availableFarmsLabel: 'Available Farms',
    activeBadge: 'ACTIVE',
    setActiveBtn: 'Set Active',
    activeFarmIdLabel: 'Active farm ID',
    resetDemoDataTitle: 'Reset Demo Data State',
    resetDemoDataDesc: 'Restores initial animals, sensor streams, and mock records to default testing baseline.',
    resetAllDataBtn: 'Reset All Data',

    // Udder Analysis page
    supportiveVisionBadge: 'Supportive Vision Module',
    backendUploadBadge: 'Backend Upload',
    udderAnalysisSubtitle: 'Assists veterinary inspection · Upload udder image for assessment',
    animalLabel: 'Animal',
    udderStep1Title: 'Step 1: Capture or Upload Rear Udder Image',
    changePhotoBtn: 'Change Photo',
    selectPhotoBtn: 'Select Photo or Open Camera',
    photoFormatHint: 'JPG, PNG, WEBP · Direct camera capture on mobile',
    demoSampleLabel: 'Or choose a demo field sample',
    uploadingToBackend: 'Uploading to backend…',
    runningCvModel: 'Running CV model…',
    uploadUdderImageBtn: 'Upload Udder Image',
    analyzeUdderImageBtn: 'Analyze Udder Image',
    selectFileHint: 'Select a file from your device — preset URLs cannot be uploaded to the backend.',
    udderStep2Title: 'Step 2: Assessment Results',
    imageUploadedMsg: 'Image uploaded to backend',
    storedAtLabel: 'Stored at',
    supportiveVisualAssessment: 'Supportive Visual Assessment',
    cvModelLabel: 'Model',
    capturedLabel: 'Captured',
    requiresFollowUp: 'Requires Follow-up: Correlate with CMT paddle test and veterinary physical examination.',
    viewAnimalProfileLink: 'View Animal Profile',
    newScanBtn: 'New Scan',
    morphologicalRiskLabel: 'Morphological Risk Level',
    confidenceLabel: 'Confidence',
    cvObservationsLabel: 'CV Observations',
    recommendedProtocolLabel: 'Recommended Protocol',
    attachToProfileLink: 'Attach to Animal Profile',
    noScanYet: 'No scan generated yet.',
    noScanHint: 'Upload or select an image on the left and tap "Analyze" to run inference.',

    // Sidebar / Header / MoreDrawer
    activeModeShort: 'Active Mode',
    lowResourceModeShort: 'Collar + Phone + CMT',
    connectedModeShort: 'Multi-sensor + Lab SCC',
    livestockHealthGuard: 'Livestock Health Guard',
    sidebarFooterDisclaimer: 'AI Early Screening • Not a replacement for veterinary diagnosis.',
    selectFarmArchitecture: 'Select Farm Architecture',
    farmArchitectureAdaptDesc: 'Adapts features to available field equipment',
    lowResourceModeShortDesc: 'Collar, phone observations & CMT paddle. No lab/SCC required.',
    connectedModeShortDesc: 'Automated parlour, inline EC/pH sensors & lab SCC integration.',
    moreDrawerSubtitle: 'Explore all dairy intelligence modules',
    modeLabel: 'Mode',
    descLiveMonitoring: 'MPU6050, DS18B20, MAX9814 sensor feeds',
    descAnalytics: 'Activity, Rumination, THI, Risk trends',
    descAddData: 'Manual logs & rapid field forms',
    descMilkData: 'Yield, EC, pH and SCC history',
    descCmtTests: '4-quarter paddle scoring & results',
    descHealthRecords: 'Veterinary treatments & follow-ups',
    descUdderAnalysis: 'Multimodal visual asymmetry scan',
    descDevices: 'Smart collars, ambient nodes & battery',
    descReports: 'Herd health summaries & CSV exports',
    descFarmMap: 'GIS cluster risk & farm locations',
    descSettings: 'Thresholds, species baselines & sensors',
    descProfile: 'Dairy operator & veterinary credentials',

    // ScientificDisclaimer
    clinicalProtocolsBadge: 'Clinical Protocols',
    sectionRumination: 'Rumination',
    sectionSurfaceTemp: 'Surface Temp',
    sectionUdderScan: 'Udder Scan',
    sectionSccData: 'SCC Data',
    sectionScope: '7–14 Day Scope',
    sectionDecisionSupport: 'Decision Support',

    // AI Health Signals extra
    computedLabel: 'Computed',
    scoreLabel: 'Score',
    behaviorPendingDesc: 'Model 3 behavior endpoint is not yet connected. Activity and rumination deviation signals will appear here once the backend behavior classifier is integrated.',
    observationWindowLabel: 'Observation window',

    // Dashboard extra
    openAlertsLabel: 'Open Alerts',
    avgHerdYield: 'Avg Herd Yield',
    moderateRiskAnimals: 'Moderate Risk',
    runCmt: 'Run CMT',
    scanUdder: 'Scan Udder',
    aiContributingFactors: 'AI Contributing Factors',
    fromBackendSorted: 'From backend — sorted by creation date',
    rankedByRisk: 'Ranked by multimodal early-risk score deviation',
    lowResourceSmallholder: 'Low-Resource Smallholder',
    connectedMultiSensor: 'Connected Multi-Sensor',
    totalLabel: 'Total',
    retryBtn: 'Retry',

    // Animals page
    profileAndRisk: 'Profile & Risk',
    profileAndLiveData: 'Profile & Live Data',
    ageLabel: 'Age',
    lactationLabel: 'Lactation',
    statusLabel: 'Status',
    mastitisHxLabel: 'Mastitis Hx',
    collarLabel: 'Collar',
    riskDriversLabel: 'Risk Drivers',
    showingAnimals: 'Showing',
    ofLabel: 'of',
    allRiskLevels: 'All Risk Levels',
    allSpeciesCowsOnly: '🐄 Cows Only',
    allSpeciesBuffaloOnly: '🐃 Buffaloes Only',
    herdRegistryDesc: 'Dairy cattle & buffalo herd health intelligence registry',
    liveBackendDesc: 'Live backend data',
    searchTagBreedPlaceholder: 'Search tag ID, breed…',
    refreshLabel: 'Refresh',
    viewLabel: 'View',
    breedNotSpecified: 'Breed not specified',
    tagIdLabel: 'Tag ID',

    // AnimalDetails
    recordCmtBtn: 'Record CMT',
    logMilkBtn: 'Log Milk',
    udderScanBtn: 'Udder Scan',
    confirmatoryProtocol: 'Confirmatory Evaluation Protocol',
    cmtPaddleCheck: 'Perform CMT paddle check at next milking.',
    checkRearQuarters: 'Check rear quarters for localized warmth or firmness.',
    antisepticDip: 'Apply post-milking antiseptic dip.',
    baselineSkinTempLabel: 'Baseline Skin Temp',
    baselineRuminationLabel: 'Baseline Rumination',
    baselineActivityLabel: 'Baseline Activity',
    avgDailyMilkLabel: 'Avg Daily Milk',
    liveIotSensors: 'Live IoT Collar Sensors',
    milkingRecordsTitle: 'Milking Records & Milk Quality',
    cmtHistoryTitle: 'CMT 4-Quarter History',
    vetNotesTitle: 'Veterinary Notes & Treatments',
    logTreatmentBtn: 'Log Treatment',
    observationLabel: 'Observation',
    treatmentLabel: 'Treatment',
    vetLabel: 'Vet',
    followUpLabel: 'Follow-Up',
    computeRiskBtn: 'Compute Risk',
    forecastLabel: 'Forecast',
    riskScoreHistoryTitle: 'Risk Score History (Backend)',
    screeningEventTimeline: 'Screening & Event Timeline',
    earlyRiskScoreLabel: 'Early Risk Score',
    collarAttachedLabel: 'Smart Collar Attached',
    liveTelemetryBadge: 'Live Telemetry',
    barnThi: 'Barn THI',
    ambientTemp: 'Ambient Temp',
    humidityLabel: 'Humidity',
    dimLabel: 'DIM',
    unknown: 'Unknown',
    notPaired: 'Not Paired',
    yesLabel: 'Yes',
    noLabel: 'No',

    // Analytics extra
    surfaceTempLabel: 'Surface Temp (°C)',
    aiRuminationLabel: 'Rumination (min)',
    activityRawShort: 'Activity Index',
    rangeAffectsFetch: '(range affects sensor fetch limit)',
    loadingBackendSensor: 'Loading backend sensor data…',

    // Alerts extra
    reviewBtn: 'Review',
    demoDataBadge: 'DEMO DATA',
    noFarmAlertData: 'No farm connected. Alert data requires a farm assignment.',
    foundLabel: 'alerts found',
    severityLabel: 'Severity',

    // AddData page
    addDataSubtitle: 'Centralized field data logging hub for smallholder farmers, dairy supervisors & para-veterinarians',
    registerLivestockTitle: 'Register Livestock',
    registerLivestockDesc: 'Enroll a new cow or buffalo into the health intelligence system. Calibrate baseline vitals.',
    registerLivestockBadge: 'RFID / Tag',
    milkingRecordQualityTitle: 'Milking Record & Quality',
    milkingRecordQualityDesc: 'Record morning/evening milk yield, temperature, electrical conductivity, pH, and SCC laboratory results.',
    milkingRecordBadge: 'Daily Production',
    cmtTestTitle: 'California Mastitis Test (CMT)',
    cmtTestDesc: 'Log 4-quarter paddle test readings (LF, RF, LR, RR) for somatic cell gelation detection.',
    cmtTestBadge: 'Gold Standard Field Test',
    vetLogTitle: 'Veterinary Treatment Log',
    vetLogDesc: 'Record physical signs, teat inspections, veterinary diagnoses, antibiotic therapy or barrier dips.',
    vetLogBadge: 'Clinical History',
    udderAsymmetryTitle: 'Udder Asymmetry Visual Analysis',
    udderAsymmetryDesc: 'Upload or snap a photograph of the rear quarters to screen for morphological swelling, erythema, and quarter asymmetry.',
    aiVisionBadge: 'AI Vision Scan',
    launchCameraBtn: 'Launch Camera & Vision Module',
    openFormBtn: 'Open Form',
    bestFieldPracticesTitle: 'Best Field Practices: Low-Resource Mastitis Protocol',
    stripCupTitle: '1. Strip Cup Examination',
    stripCupDesc: 'Before milking, strip 2–3 squirts into a dark cup. Look for watery consistency, clots, or flakes.',
    cmtPaddleStepTitle: '2. 4-Quarter CMT Paddle',
    cmtPaddleStepDesc: 'Mix equal parts milk and reagent (2 mL each). Swirl for 20 seconds. Gel formation indicates elevated somatic cells.',
    postMilkingDipTitle: '3. Post-Milking Teat Barrier Dip',
    postMilkingDipDesc: 'Dip teats with 0.5% iodophor or validated herbal antiseptic immediately after milking. Keep animal standing for 30 minutes.',

    // MilkData page
    showingRecords: 'Showing',
    deleteMilkConfirm: 'Delete this milk record?',
    milkDeletedToast: 'Milk record deleted',
    noMilkFoundTitle: 'No milk records found.',
    clickToRecordMilk: 'Click "Record Milking" to log daily yields.',
    lowResourceModeTag: 'Low-Resource Mode',

    // CMT page
    showingLabel: 'Showing',
    deleteCmtConfirm: 'Delete this CMT record?',
    cmtDeletedToast: 'CMT record deleted',
    noCmtFoundTitle: 'No CMT records found.',

    // HealthRecords page
    deleteHealthConfirm: 'Delete this health and veterinary record?',
    healthDeletedToast: 'Record deleted',
    noHealthFoundTitle: 'No health records found.',
    clickLogVet: 'Click "Log Veterinary Treatment" to register a clinical observation.',
    subjectLabel2: 'Subject',

    // LiveMonitoring extra
    noSensorDataAnimal: 'No sensor data received yet for this animal.',

    // UdderAnalysis extra
    sciConstraintTitle: 'Scientific Constraint & Disclaimer',
    sciConstraintDesc: 'This visual assessment is supportive only — not a standalone veterinary diagnosis. Udder morphology varies by breed, lactation stage and milking fullness. Always correlate with CMT or veterinary SCC analysis.',
    liveInfoDesc: 'In live mode, images are uploaded to the backend. The CV analysis is a stub — real model output will appear when the CV pipeline is connected. You must select an actual file (preset URLs cannot be uploaded).',
    cvAnalysisPendingDesc: 'The computer vision pipeline is a stub in the current backend version. Results will appear here when the CV model is connected.',
    possibleSwelling: 'Possible Swelling',
    possibleRedness: 'Possible Redness',
    visibleAsymmetry: 'Visible Asymmetry',
    cvConfidence: 'CV Confidence',
    cvLesions: 'Lesions',
    cvDischarge: 'Discharge',
    statusProcessed: 'Processed (Demo)',
    requiresFollowUpTitle: 'Requires Follow-up',
    pleaseUploadPhoto: 'Please upload or select an udder photo first',
    pleaseSelectAnimal: 'Please select an animal first',

    // Devices extra
    onlineOutOf: 'Online',
    signalConnected: '-68 dBm',
    signalWeak: 'Weak',

    // FarmMap extra
    coopHubsMapped: '4 Co-operative Hubs Mapped',
    farmMapGeographicDesc: 'Geographic herd risk visualization, regional heat stress (THI) & shed clusters',
    headsLabel: 'Heads',

    // Reports extra
    requireCmtConfirmation: 'Require CMT Confirmation',
    cowsLabel: 'Cows',
    buffaloesPluralLabel: 'Buffaloes',
    generatedOn: 'Generated on',
    auditId: 'Audit ID',
    farmClusterName: 'Anand Dairy Co-operative Cluster',
    farmClusterLocation: 'Gujarat, India • Supervised Field Pilot',

    // Settings extra
    activeColonLabel: 'Active:',
    uniqueShortId: 'unique short ID',
    connectedToApi: 'Connected to',
    calibrationSavedToast: 'Calibration thresholds saved to device',
    calibrationResetToast: 'Thresholds reset to defaults',
    demoDataResetToast: 'Demo data restored to default state',
    farmCreatedToast: 'Farm created',
    activeFarmUpdatedToast: 'Active farm updated',
    languageSetToast: 'Language set to',
    resetDemoConfirm: 'Reset all data back to original demo state? All newly created records will be lost.',
    farmNameCodeRequired: 'Farm name and code are required.',
    failedCreateFarm: 'Failed to create farm',
    farmCreatedMsg: 'Farm created',

    // Profile extra
    lowResourceModeValue: 'Low-Resource Mode',
    connectedModeValue: 'Connected Mode',
    goDrishtiUser: 'GoDrishti User',
    profileSubtitle: 'GoDrishti Dairy Livestock Health Intelligence',

    // Modal form labels
    selectAnimalModalLabel: 'Select Animal *',
    backendLabel2: 'Backend',
    loadingAnimalsLabel: 'Loading animals…',
    noBackendAnimalsMsg: 'No backend animals found. Check farm assignment.',
    dataSourceLabel: 'Data Source',
    farmerObservation: 'Farmer Observation',
    fieldKitPaddle: 'Field Kit / Paddle',
    labSubmission: 'Lab Submission',
    veterinaryClinic: 'Veterinary Clinic',
    milkingDateLabel: 'Milking Date',
    milkYieldLabel: 'Milk Yield (Liters) *',
    milkTempCLabel: 'Milk Temp (°C)',
    electricalCondLabel: 'Electrical Cond. (mS/cm)',
    electricalCondHint: 'Healthy: 5.0 – 5.5',
    milkPhLabel: 'Milk pH',
    milkPhHint: 'Healthy: 6.6 – 6.8',
    sccCellsLabel: 'SCC (×10³ cells/mL)',
    sccNotMeasured: 'Not measured by collars — enter lab/rapid test result.',
    visualObsLabel: 'Visual Observations / Notes',
    saveMilkDataBtn: 'Save Milk Data',
    testDateLabel: 'Test Date',
    cmtPaddleReadingsLabel: 'CMT 4-Quarter Paddle Readings',
    testerNameLabel: 'Tester Name / Role',
    fieldNotesLabel: 'Field Notes',
    saveCmtRecordBtn: 'Save CMT Record',
    physicalObservationLabel: 'Physical Observation *',
    suspectedConditionLabel: 'Suspected Condition',
    treatmentInterventionLabel: 'Treatment / Intervention',
    vetNotesModalLabel: 'Veterinary Notes',
    vetParavetLabel: 'Veterinarian / Para-vet',
    followUpDateLabel: 'Follow-Up Date',
    udderTempLabel: 'Udder Temp (°C)',
    saveHealthRecordBtn: 'Save Health Record',
    registerNewLivestockTitle: 'Register New Livestock',
    recordMilkQualityTitle: 'Record Milking & Milk Quality',
    cmtFourQuarterTitle: 'California Mastitis Test (CMT) 4-Quarter Log',
    vetObsTreatmentTitle: 'Log Veterinary Observation & Treatment',
    savesToBackendBadge: '🟢 Saves to Backend',
    demoLocalBadge: '🟡 Demo Mode (localStorage)',
    farmLinkedMsg: 'Animal will be created in backend and linked to this farm.',
    baselineNotice: 'Baseline values for DS18B20 skin temperature and MAX9814 acoustic rumination will calibrate across the first 7 days.',
    registerAnimalBtn2: 'Register Animal',
    healthyLabel: 'Healthy',
    investigateLabel: 'Investigate',
    clearLabel: 'Clear',
    precipitateLabel: 'Precipitate',
    gelLabel: 'Gel',

    // Toast messages
    toastAlertAcknowledged: 'Alert acknowledged',
    toastAlertResolved: 'Alert resolved',
    toastFailedAcknowledge: 'Failed to acknowledge alert',
    toastFailedResolve: 'Failed to resolve alert',
    toastDashboardRefreshed: 'Dashboard refreshed',
    toastRiskComputed: 'Risk computed',
    toastFailedRisk: 'Risk computation failed',
    toastAnimalRegistered: 'Livestock registered!',
    toastFailedRegister: 'Failed to register animal',
    toastMilkSaved: 'Milk record logged for',
    toastFailedMilkSave: 'Failed to save milk data',
    toastCmtSaved: 'CMT test saved for',
    toastFailedCmtSave: 'Failed to save CMT record',
    toastHealthSaved: 'Health record logged for',
    toastFailedHealthSave: 'Failed to save health record',
    toastSwitchedConnected: 'Switched to Connected Farm Mode (Advanced Lab & Sensors enabled)',
    toastSwitchedLowResource: 'Switched to Low-Resource Mode (Collar, Mobile & CMT focused)',
    toastDevicePingSuccess: 'Device responded! Latency: 42ms (BLE Mesh)',
    toastDeviceStatus: 'Device status set to',
    toastReportDownloaded: 'Report downloaded as PDF/CSV summary',
    toastAnalyticsCsvLive: 'Analytics CSV exported from backend data',
    toastAnalyticsCsvDemo: 'Analytics CSV exported (demo data)',
    toastUdderUploaded: 'Udder image uploaded to backend',
    toastUdderAssessed: 'Supportive visual assessment complete',
  },
  hi: {
    appName: 'GoDrishti',
    appSubtitle: 'एआई डेयरी पशु थनैला (मस्टाइटिस) स्वास्थ्य प्रणाली',
    demoDataNotice: 'डेमो डेटा — भारतीय डेयरी फार्म निरंतर निगरानी व सत्यापन',
    lowResourceMode: 'किफायती फार्म मोड',
    connectedMode: 'कनेक्टेड फार्म मोड',
    modeDescription: 'भारतीय छोटे किसानों हेतु कॉलर, फोन और सीएमटी अनुकूलित',

    dashboard: 'डैशबोर्ड',
    animals: 'पशु प्रबंधन',
    animalDetails: 'पशु प्रोफाइल',
    liveMonitoring: 'लाइव निगरानी',
    analytics: 'एनालिटिक्स',
    alerts: 'चेतावनी (अलर्ट)',
    addData: 'डेटा जोड़ें',
    milkData: 'दूध डेटा',
    cmtTests: 'सीएमटी टेस्ट',
    healthRecords: 'स्वास्थ्य रिकॉर्ड',
    udderAnalysis: 'अयन (थन) विश्लेषण',
    devices: 'आईओटी उपकरण',
    reports: 'रिपोर्ट्स',
    farmMap: 'फार्म नक्शा / जीआईएस',
    settings: 'सेटिंग्स',
    profile: 'प्रोफाइल',
    more: 'अधिक विकल्प',

    cows: 'गायें',
    buffaloes: 'भैंसें',
    allSpecies: 'सभी पशु',
    cow: 'गाय',
    buffalo: 'भैंस',

    riskOverview: 'जोखिम स्क्रीनिंग अवलोकन',
    noRisk: 'अलर्ट सीमा से नीचे',
    lowRisk: 'कम जोखिम (26–50)',
    moderateRisk: 'मध्यम जोखिम (51–75)',
    highRisk: 'उच्च जोखिम (76–100)',
    riskScore: 'जोखिम स्कोर',
    riskTrend: 'जोखिम प्रवृत्ति',
    contributingFactors: 'जोखिम बढ़ाने वाले बायोमार्कर',
    explainability: 'व्याख्या योग्य एआई कारण',
    topPriorityAnimals: 'प्राथमिक जांच योग्य पशु',

    herdOverview: 'पशुधन अवलोकन',
    totalAnimals: 'कुल पशु',
    connectedDevices: 'सक्रिय स्मार्ट कॉलर',
    activeAlerts: 'सक्रिय अलर्ट',
    activity: 'सक्रियता सूचकांक',
    movement: 'गर्दन की गति',
    surfaceTemperature: 'त्वचा/सतह तापमान',
    aiInferredRumination: 'एआई-अनुमानित जुगाली',
    chewing: 'चबाने की ध्वनि',
    ambientTemperature: 'परिवेश तापमान',
    humidity: 'शेड आर्द्रता',
    thi: 'टीएचआई (तनाव सूचकांक)',
    milkYield: 'दूध उत्पादन (लीटर)',
    electricalConductivity: 'विद्युत चालकता',
    ph: 'दूध पीएच',
    scc: 'एससीसी (सोमैटिक सेल)',

    measured: 'मापा गया',
    estimated: 'अनुमानित',
    aiInferred: 'एआई-अनुमानित',

    quickActions: 'त्वरित क्रियाएं',
    addAnimal: 'नया पशु जोड़ें',
    recordMilk: 'दूध डेटा दर्ज करें',
    newCmtTest: 'सीएमटी टेस्ट जोड़ें',
    addHealthRecord: 'स्वास्थ्य रिकॉर्ड लिखें',
    viewAnalytics: 'एनालिटिक्स देखें',
    acknowledge: 'स्वीकार करें',
    review: 'समीक्षा करें',
    resolve: 'हल मार्क करें',
    viewAnimal: 'पशु देखें',
    search: 'टैग, नाम या नस्ल खोजें...',
    filter: 'फिल्टर',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    confirm: 'पुष्टि करें',
    retry: 'पुनः प्रयास',

    scientificNotice: 'वैज्ञानिक एवं नैदानिक दिशा-निर्देश',
    ruminationNote: 'कॉलर माइक ध्वनि पकड़ता है; एआई चबाने की आवाज से जुगाली का अनुमान लगाता है।',
    tempNote: 'DS18B20 सेंसर केवल त्वचा का तापमान मापता है, आंतरिक शरीर का नहीं।',
    udderNote: 'थन का दृश्य विश्लेषण एक सहायक साधन है, स्वतंत्र निदान नहीं।',
    sccNote: 'एससीसी लैब या परीक्षण किट से दर्ज किया जाता है।',
    validationNote: 'यह मॉडल 7–14 दिन पूर्व चेतावनी हेतु शोध में है।',
    vetDisclaimer: 'GoDrishti केवल पूर्व-चेतावनी और निर्णय सहायता देता है; यह पशु चिकित्सक का विकल्प नहीं है।',

    alertPriority: 'प्राथमिकता',
    critical: 'गंभीर',
    high: 'उच्च',
    medium: 'मध्यम',
    low: 'सामान्य',
    recentAlerts: 'हालिया पूर्व-चेतावनी अलर्ट',

    leftFront: 'बायां अगला थन (LF)',
    rightFront: 'दायां अगला थन (RF)',
    leftRear: 'बायां पिछला थन (LR)',
    rightRear: 'दायां पिछला थन (RR)',
    overallResult: 'समग्र सीएमटी परिणाम',

    // AI Signal UI
    aiHealthSignals: 'एआई स्वास्थ्य संकेत',
    model1Label: 'मॉडल 1 — थनैला पूर्वानुमान',
    model1SubLabel: 'नियम-आधारित स्क्रीनिंग इंजन',
    model1Disclaimer: 'विकास मॉडल — नैदानिक सत्यापन आवश्यक।',
    model1Signal7d: '7-दिन पूर्वानुमान संकेत',
    model1Signal14d: '14-दिन पूर्वानुमान संकेत',
    model2Label: 'मॉडल 2 — थन छवि एआई',
    model2SubLabel: 'दृश्य मूल्यांकन सहायता',
    model3Label: 'मॉडल 3 — व्यवहार संकेत',
    model3SubLabel: 'जुगाली और गतिविधि विचलन',
    signalElevated: 'उन्नत',
    signalBelowThreshold: 'अलर्ट सीमा से नीचे',
    signalInsufficient: 'अपर्याप्त डेटा',
    signalInsufficientDetail: 'पूर्वानुमान के लिए पर्याप्त ऐतिहासिक डेटा उपलब्ध नहीं है।',
    signalPending: 'एकीकरण लंबित',
    behaviorNormal: 'सामान्य',
    behaviorMildDeviation: 'हल्का विचलन',
    behaviorModerateDeviation: 'मध्यम विचलन',
    behaviorHighDeviation: 'उच्च विचलन',
    provenanceManual: 'मैन्युअल',
    provenanceSensor: 'सेंसर',
    provenanceImported: 'आयातित',
    provenanceAiModel: 'एआई मॉडल',
    provenanceSynthetic: 'सिंथेटिक विकास डेटा',

    // Dashboard
    priorityConfirmation: 'प्राथमिक पुष्टि',
    requireCmtExam: 'सीएमटी / जांच आवश्यक',
    noElevatedSignal: 'कोई उन्नत संकेत नहीं',
    lowSignalCount: 'कम संकेत',
    deviceLocalBadge: 'डिवाइस-स्थानीय',
    lowBattery: 'कम बैटरी',
    rapidFieldEntry: 'त्वरित फील्ड डेटा प्रविष्टि',
    viewAllAnimals: 'सभी पशु देखें',
    viewAllAlerts: 'सभी अलर्ट देखें',
    aiSignalDistLive: 'एआई स्क्रीनिंग संकेत वितरण (बैकएंड)',
    aiSignalDistDemo: 'एआई स्क्रीनिंग संकेत वितरण — निदान नहीं',
    aiModelSignalLabel: 'A — एआई मॉडल संकेत',
    aiModelSignalDesc: 'नियम-आधारित स्क्रीनिंग इंजन आउटपुट। निदान नहीं।',
    confirmatoryRequiredLabel: 'B — पुष्टि आवश्यक',
    confirmatoryRequiredDesc: 'सीएमटी, एससीसी या पशु चिकित्सा जांच से पुष्टि करें।',
    noActiveAlerts: 'अभी कोई सक्रिय अलर्ट नहीं।',
    noFarmConnected: 'कोई फार्म नहीं जुड़ा। सेटिंग्स में जाकर फार्म असाइन करें।',
    appBannerSubtitle: 'बहुविध प्रारंभिक जोखिम स्क्रीनिंग — केवल एआई संकेत, निदान नहीं।',
    computing: 'गणना हो रही है…',
    refreshSignalsBtn: 'जोखिम इंजन चलाएं (सभी पशु)',
    demoDataLabel: 'डेमो डेटा',
    liveLabel: 'लाइव',

    // Navigation / page strings
    backToAnimals: 'पशु सूची पर वापस',
    returnToHerdList: 'पशुधन सूची पर वापस',
    animalNotFound: 'पशु नहीं मिला',
    animalNotFoundDesc: 'अनुरोधित पशु प्रोफाइल मौजूद नहीं है।',
    couldNotLoadAnimal: 'पशु लोड नहीं हो सका',
    sensorDataTab: 'सेंसर डेटा',
    milkTab: 'दूध',
    healthCmtTab: 'स्वास्थ्य और सीएमटी',
    riskHistoryTab: 'संकेत इतिहास',
    sensorReadingHistory: 'सेंसर रीडिंग इतिहास',
    mostRecentSensorData: 'नवीनतम कॉलर + शेड सेंसर डेटा',
    refreshBtn: 'रीफ्रेश',
    noSensorReadings: 'अभी कोई सेंसर रीडिंग उपलब्ध नहीं है। कॉलर डेटा के आने पर दिखेगा।',
    noMilkRecords: 'अभी कोई दूध रिकॉर्ड नहीं है।',
    noCmtRecords: 'अभी कोई सीएमटी रिकॉर्ड नहीं है।',
    noHealthRecords: 'अभी कोई स्वास्थ्य रिकॉर्ड नहीं है।',
    noSignalHistory: 'अभी कोई संकेत इतिहास उपलब्ध नहीं है।',
    logMilking: 'दूध दर्ज करें',
    newCmt: 'नया सीएमटी',
    logTreatment: 'उपचार दर्ज करें',
    noFarmWarning: 'कोई फार्म नहीं जुड़ा। सेटिंग्स में जाएं या एडमिन से संपर्क करें।',
    noFarmWarningAnimals: 'कोई फार्म असाइन नहीं। एडमिन से संपर्क करें या सेटिंग्स में जाएं।',
    noFarmWarningAnalytics: 'कोई फार्म नहीं जुड़ा। लाइव एनालिटिक्स के लिए फार्म असाइन करें।',
    noFarmWarningMonitoring: 'कोई फार्म असाइन नहीं। सेंसर डेटा के लिए कनेक्टेड फार्म खाता आवश्यक है।',
    noAnimalsFound: 'कोई पशु नहीं मिला।',
    noAnimalsFoundLive: 'इस फार्म में अभी कोई पशु पंजीकृत नहीं है।',
    noAnimalsFoundFilter: 'फिल्टर बदलकर देखें।',
    addAnimalsLink: 'पशु जोड़ें →',
    loadingSensorData: 'बैकएंड सेंसर डेटा लोड हो रहा है…',
    noSignalAvailable: 'अभी कोई संकेत डेटा उपलब्ध नहीं है।',
    loadingRiskData: 'जोखिम डेटा लोड हो रहा है…',

    // AI Health Signals
    currentScreeningSignal: 'वर्तमान स्क्रीनिंग संकेत',
    ruleBasedEngineOutput: 'नियम-आधारित इंजन आउटपुट',
    contributingFactorsLabel: 'योगदान करने वाले कारक',
    allParamsNormal: 'सभी मापदंड सामान्य सीमा में हैं।',
    recommendedActionLabel: 'अनुशंसित कार्रवाई',
    temporalForecastingSignals: 'समयिक पूर्वानुमान संकेत',
    notYetIntegrated7d: 'gorakshak_forecast_7d_xgb_v2 — अभी एकीकृत नहीं',
    notYetIntegrated14d: 'gorakshak_forecast_14d_xgb_v2 — अभी एकीकृत नहीं',
    windowComputedLabel: 'विंडो',
    imageStoredAt: 'छवि संग्रहीत',
    cvAnalysisPending: 'मॉडल 2 जुड़ने पर सीवी विश्लेषण दिखेगा।',
    correlateWithCmt: 'सीएमटी या पशु चिकित्सा एससीसी जांच से सत्यापित करें।',
    noUdderImageUploaded: 'इस पशु की अभी कोई छवि अपलोड नहीं हुई है, या मॉडल 2 अभी नहीं जुड़ा है।',
    udderUploadViaPage: 'थन विश्लेषण पृष्ठ से छवि अपलोड करें।',
    udderImageDisclaimer: 'थन छवि मूल्यांकन केवल सहायक है — स्वतंत्र पशु चिकित्सा निदान नहीं।',
    behaviorIndependentDisclaimer: 'व्यवहार संकेत एक स्वतंत्र अवलोकन है। यह थनैला संभावना नहीं दर्शाता।',
    independentSignalsNotice: 'नीचे दिए तीन संकेत स्वतंत्र हैं। इन्हें औसत नहीं किया जाता और ये संयुक्त निदान संभावना नहीं बनाते।',
    refreshSignals: 'संकेत रीफ्रेश करें',
    computingLabel: 'गणना हो रही है…',

    // Animal registration form
    animalPhotoLabel: 'पशु की फोटो',
    animalPhotoHint: 'पहचान के लिए पशु की फोटो अपलोड करें (वैकल्पिक)',
    selectPhoto: 'फोटो चुनें',
    removePhoto: 'फोटो हटाएं',
    replacePhoto: 'फोटो बदलें',
    photoPreview: 'फोटो पूर्वावलोकन',
    registerAnimalBtn: 'पशु पंजीकृत करें',
    tagRfid: 'टैग / आरएफआईडी *',
    nameIdentifier: 'नाम / पहचानकर्ता *',
    speciesLabel: 'प्रजाति *',
    breedLabel: 'नस्ल *',
    ageYears: 'आयु (वर्ष)',
    lactationNumber: 'दुग्धावस्था क्रमांक',
    daysInMilk: 'दुग्धावस्था दिन',
    avgYield: 'औसत उत्पादन (लीटर/दिन)',
    collarId: 'स्मार्ट कॉलर आईडी',
    farmShedCluster: 'फार्म / शेड क्लस्टर',
    baselineCalibrationNotice: 'DS18B20 त्वचा तापमान और MAX9814 जुगाली ध्वनि के आधार रेखा मान पहले 7 दिनों में कैलिब्रेट होंगे।',

    // Common UI
    settingsLink: 'सेटिंग्स',
    noFarmConnectedTitle: 'कोई फार्म नहीं जुड़ा',
    noFarmConnectedDesc: 'आपके खाते में कोई फार्म असाइन नहीं है। सेटिंग्स में जाएं या एडमिन से संपर्क करें।',

    // Login / Register
    signInHeading: 'अपने खाते में साइन इन करें',
    emailAddressLabel: 'ईमेल पता',
    emailPlaceholder: 'kisan@vaishnavidairy.in',
    passwordLabel: 'पासवर्ड',
    signingInLabel: 'साइन इन हो रहा है…',
    signInBtn: 'साइन इन',
    newToGoDrishti: 'GoDrishti पर नए हैं?',
    createAccountLink: 'खाता बनाएं',
    backendLabel: 'बैकएंड',
    errorEmailRequired: 'ईमेल और पासवर्ड आवश्यक हैं।',
    errorInvalidCredentials: 'गलत ईमेल या पासवर्ड।',
    errorCannotReachServer: 'सर्वर से जुड़ नहीं पा रहे। बैकएंड स्थिति जांचें।',
    errorLoginFailed: 'साइन इन विफल। पुनः प्रयास करें।',
    errorUnexpected: 'अज्ञात त्रुटि। पुनः प्रयास करें।',
    createAccountHeading: 'खाता बनाएं',
    accountCreatedMsg: 'खाता बन गया! लॉगिन पर पुनर्निर्देशित हो रहे हैं…',
    fullNameLabel: 'पूरा नाम *',
    emailLabel: 'ईमेल *',
    passwordPlaceholderMinChar: 'कम से कम 6 अक्षर',
    phoneOptionalLabel: 'फोन (वैकल्पिक)',
    roleLabel: 'भूमिका',
    roleFarmer: 'किसान',
    roleVet: 'पशु चिकित्सक',
    roleAdmin: 'एडमिन',
    creatingAccountLabel: 'खाता बनाया जा रहा है…',
    createAccountBtn: 'खाता बनाएं',
    alreadyHaveAccount: 'पहले से खाता है?',
    signInLink: 'साइन इन करें',
    errorNameEmailRequired: 'नाम, ईमेल और पासवर्ड आवश्यक हैं।',
    errorPasswordTooShort: 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए।',
    errorEmailExists: 'इस ईमेल से पहले से खाता मौजूद है।',
    signOutBtn: 'साइन आउट',

    // Alerts page
    alertsSubtitleLive: 'बैकएंड जोखिम इंजन से रीयल-टाइम अलर्ट',
    alertsSubtitleDemo: 'प्रारंभिक बायोमार्कर विचलन के लिए स्वचालित सूचनाएं',
    acknowledgeAllActive: 'सभी सक्रिय स्वीकार करें',
    alertsDemoNotice: 'अलर्ट स्थानीय डेमो स्टोरेज से हैं। रीयल अलर्ट के लिए बैकएंड से जुड़ें।',
    filterSeverityLabel: 'गंभीरता',
    filterStatusLabel: 'स्थिति',
    filterAll: 'सभी',
    statusOpen: 'खुला',
    statusAcknowledged: 'स्वीकृत',
    statusResolved: 'हल',
    statusFalsePositive: 'गलत पॉजिटिव',
    foundAlertsCount: 'अलर्ट मिले',
    noAlertsFound: 'कोई अलर्ट नहीं मिला।',
    allVitalsNormal: 'सभी पशुधन संकेतक सामान्य हैं।',
    animalIdLabel: 'पशु आईडी',
    markFalsePositive: 'गलत पॉजिटिव',
    noAlertsMatchCriteria: 'मानदंड से मेल खाते अलर्ट नहीं मिले।',
    allVitalsAndNodesNormal: 'सभी पशुधन संकेतक और कॉलर नोड सामान्य हैं।',
    subjectLabel: 'विषय',

    // Analytics page
    analyticsSubtitleLive: 'लाइव बैकएंड सेंसर ट्रेंड · सतह तापमान, जुगाली, गतिविधि, THI और जोखिम स्कोर',
    analyticsSubtitleDemo: 'बहु-बायोमार्कर पूर्वानुमान ट्रेंड · डेमो डेटा',
    exportCsv: 'CSV निर्यात करें',
    analyticsDemoNotice: 'चार्ट स्थिर मॉक डेटा उपयोग करते हैं। VITE_DEMO_MODE=false करें।',
    selectAnimalLabel: 'पशु चुनें',
    loadingLabel: 'लोड हो रहा है…',
    herdAverageOption: 'पशुधन औसत',
    noSensorDataForAnimal: 'इस पशु के लिए अभी कोई सेंसर डेटा नहीं है।',
    chartTitleSurfaceTemp: 'त्वचा सतह तापमान बनाम परिवेश',
    chartSubtitleSurfaceTemp: 'DS18B20 त्वचा जांच बनाम SHT31-D शेड नोड (°C)',
    chartTitleRumination: 'एआई-अनुमानित जुगाली (मिनट/दिन)',
    chartSubtitleRumination: 'MAX9814 चबाने की ध्वनि से अनुमानित',
    chartTitleActivity: 'गतिविधि / गर्दन की गति सूचकांक',
    chartSubtitleActivity: 'MPU6050 एक्सेलेरोमीटर कच्चा स्कोर',
    chartTitleRiskScoreLive: 'जोखिम स्कोर इतिहास (0–100)',
    chartTitleRiskScoreDemo: 'सतत पशुधन प्रारंभिक जोखिम ट्रेंड (0–100)',
    chartSubtitleRiskLive: 'बैकएंड जोखिम इंजन आउटपुट',
    chartSubtitleRiskDemo: 'समग्र बहुविध जोखिम सूचकांक',
    aiIndexBadge: 'एआई सूचकांक',
    chartTitleThi: 'शेड THI (तापमान-आर्द्रता सूचकांक)',
    chartSubtitleThi: 'SHT31-D नोड से — तनाव सीमा: मध्यम >68, उच्च >72',

    // CMT page
    cmtSubtitle: 'कैलिफोर्निया मास्टाइटिस टेस्ट (सीएमटी) 4-पैडल जेलेशन स्क्रीनिंग',
    filterLivestockLabel: 'पशु फिल्टर करें',
    allHerdRecordsOption: 'सभी पशुधन रिकॉर्ड',
    showingPaddleEvals: 'पैडल मूल्यांकन दिखाए जा रहे हैं',
    dateLabel: 'तारीख',
    evaluatorLabel: 'मूल्यांकक',
    paddleReadingsLabel: '4-पैडल रीडिंग',
    noteLabel: 'नोट',
    normalSomaticRange: 'सामान्य सोमैटिक सेलुलर रेंज',
    suspectedSccElevation: 'संदिग्ध सोमैटिक सेल वृद्धि',
    cmtEmptyHint: '"सीएमटी टेस्ट जोड़ें" पर क्लिक करें।',

    // Devices page
    devicesSubtitle: 'आईओटी स्मार्ट कॉलर नोड (MPU6050, DS18B20, MAX9814) और SHT31-D शेड टेलीमेट्री',
    devicesOnlineCount: 'ऑनलाइन',
    assignedSubjectLabel: 'असाइन किया गया पशु',
    unassignedSpareNode: 'असाइन नहीं (स्पेयर नोड)',
    batteryChargeLabel: 'बैटरी चार्ज',
    firmwareLabel: 'फर्मवेयर',
    sensorsLabel: 'सेंसर',
    lastTelemetrySyncLabel: 'अंतिम टेलीमेट्री सिंक',
    pingingLabel: 'पिंग हो रहा है...',
    pingNodeBtn: 'नोड पिंग करें',
    signalStrengthLabel: 'सिग्नल',

    // FarmMap page
    farmMapSubtitle: 'भौगोलिक पशुधन जोखिम दृश्य, THI और शेड क्लस्टर',
    indianDairyClusters: 'भारतीय डेयरी फार्म क्लस्टर',
    clickClusterHint: 'टेलीमेट्री देखने के लिए क्लस्टर नोड पर क्लिक करें',
    nationalTelemetryNetwork: 'राष्ट्रीय डेयरी टेलीमेट्री नेटवर्क',
    simulatedGeoNodes: 'सिम्युलेटेड जियो-नोड',
    clusterProfileLabel: 'क्लस्टर प्रोफाइल',
    livestockCensusLabel: 'पशुधन जनगणना',
    clusterMeanRiskLabel: 'क्लस्टर औसत जोखिम',
    priorityFlaggedHeadsLabel: 'प्राथमिकता चिह्नित पशु',
    barnClimateLabel: 'शेड जलवायु (SHT31-D)',
    tempLabel: 'तापमान',
    rhLabel: 'आर्द्रता',
    viewClusterAnimals: 'क्लस्टर पशु देखें',

    // Health Records page
    healthRecordsSubtitle: 'नैदानिक पशु चिकित्सा निदान, थन परीक्षण और उपचार',
    healthSearchPlaceholder: 'पशु, स्थिति, दवा खोजें...',
    showingRecordsCount: 'रिकॉर्ड',
    physicalObservationsLabel: 'शारीरिक लक्षण और अवलोकन',
    prescribedInterventionLabel: 'निर्धारित हस्तक्षेप और प्रोटोकॉल',
    notesLabel: 'नोट्स',
    scheduledFollowUpLabel: 'अनुसूचित फॉलो-अप',
    healthEmptyHint: '"पशु चिकित्सा उपचार दर्ज करें" पर क्लिक करें।',

    // Live Monitoring page
    monitoringSubtitleLive: 'बैकएंड से नवीनतम सेंसर रीडिंग — रीफ्रेश अंतराल: 30 सेकंड',
    monitoringSubtitleDemo: 'MPU6050, DS18B20, MAX9814 कॉलर नोड और SHT31-D से स्ट्रीमिंग',
    stopAutoRefresh: 'ऑटो-रीफ्रेश बंद करें',
    startAutoRefresh: 'ऑटो-रीफ्रेश (30 सेकंड)',
    pauseTelemetry: 'टेलीमेट्री रोकें',
    resumeStream: 'स्ट्रीम जारी करें',
    tickLabel: 'टिक',
    updatedAtLabel: 'अपडेट',
    filterAnimalLabel: 'पशु फिल्टर',
    allLivestockOption: 'सभी लाइव पशु',
    legendMeasured: 'मापा गया (भौतिक सेंसर)',
    legendAiInferred: 'एआई-अनुमानित (ध्वनिक)',
    legendEstimated: 'अनुमानित (THI सूचकांक)',
    noAnimalsForFarm: 'इस फार्म के लिए कोई पशु नहीं मिला।',
    baselineLabel: 'आधार रेखा',
    sensorsStable: 'सेंसर स्थिर',
    historicalGraphsLink: 'ऐतिहासिक ग्राफ →',
    backendConnectedBadge: 'बैकएंड कनेक्टेड',
    bleMeshBadge: 'ESP32 / BLE मेश',
    activityRawLabel: 'गतिविधि (कच्चा)',
    awaitingData: 'डेटा की प्रतीक्षा',
    sourceLabel: 'स्रोत',

    // Milk Data page
    milkDataSubtitle: 'दूध उत्पादन, तापमान, EC, pH और प्रयोगशाला SCC',
    submitsToBackend: 'बैकएंड पर सबमिट',
    milkDemoNotice: 'रिकॉर्ड स्थानीय रूप से संग्रहीत हैं। लाइव मोड में बैकएंड को सबमिट होगा।',
    milkSearchPlaceholder: 'पशु टैग, तारीख, नोट खोजें…',
    inlineEcPhMode: 'इनलाइन EC/pH मोड',
    tableAnimal: 'पशु',
    tableDate: 'तारीख',
    tableYield: 'उत्पादन (L)',
    tableMilkTemp: 'दूध तापमान',
    tableEc: 'EC (mS/cm)',
    tablePh: 'pH',
    tableScc: 'SCC (×10³)',
    tableNotes: 'नोट्स',
    tableActions: 'कार्रवाई',
    milkEmptyHint: '"दूध रिकॉर्ड करें" पर क्लिक करें।',

    // Profile page
    defaultUserName: 'GoDrishti उपयोगकर्ता',
    architectureLabel: 'आर्किटेक्चर',
    dairyEnterpriseLabel: 'डेयरी उद्यम और बुनियादी ढांचा',
    facilityNameLabel: 'सुविधा का नाम',
    locationLabel: 'स्थान',
    herdCapacityLabel: 'दुग्ध पशुधन क्षमता',
    supervisingVetLabel: 'पर्यवेक्षक पशु चिकित्सक',
    emergencyClinicLabel: 'आपातकालीन पशु क्लिनिक',
    systemIntelligenceLabel: 'सिस्टम इंटेलिजेंस और मॉडल प्रमाणन',
    platformArchLabel: 'प्लेटफॉर्म आर्किटेक्चर',
    modelPipelineLabel: 'मॉडल पाइपलाइन',
    clinicalScopeLabel: 'लक्ष्य नैदानिक क्षेत्र',
    scientificValidationLabel: 'वैज्ञानिक सत्यापन',
    peerReviewedCompliant: 'सहकर्मी-समीक्षित अनुपालन',
    hardwareVerificationLabel: 'बहुविध हार्डवेयर और जैविक मॉडल सत्यापन',
    acousticRuminationLabel: 'ध्वनिक जुगाली',
    skinTemperatureLabel: 'त्वचा तापमान',
    affordableFieldScreeningLabel: 'किफायती फील्ड स्क्रीनिंग',

    // Reports page
    reportsSubtitle: 'मासिक बोवाइन मास्टाइटिस प्रारंभिक स्क्रीनिंग सारांश और आर्थिक प्रभाव लेखा परीक्षा',
    printReportBtn: 'रिपोर्ट प्रिंट करें',
    exportSummaryBtn: 'सारांश निर्यात करें',
    reportDocTitle: 'डेयरी पशुधन मास्टाइटिस प्रारंभिक पूर्वानुमान व्यापक रिपोर्ट',
    reportPeriodLabel: 'लक्ष्य अवधि: वर्तमान दुग्धावस्था चक्र • उत्पन्न',
    totalScreenedHerd: 'कुल जांचे गए पशुधन',
    headsUnit: 'पशु',
    highMastitisRisk: 'उच्च मास्टाइटिस जोखिम',
    moderateRiskWatch: 'मध्यम जोखिम निगरानी',
    biomarkerTrendDeviations: 'बायोमार्कर ट्रेंड विचलन',
    estMilkLossSaved: 'अनुमानित दूध हानि बचाई',
    via7to14Detection: '7–14 दिन प्रारंभिक पहचान के माध्यम से',
    highPriorityTableTitle: 'बहुविध इंजन द्वारा उच्च प्राथमिकता पशु',
    tableTag: 'टैग',
    tableName: 'नाम',
    tableSpecies: 'प्रजाति',
    tableRiskScore: 'जोखिम स्कोर',
    tableDeviationFactors: 'प्राथमिक विचलन कारक',
    tablePrescribedAction: 'निर्धारित कार्रवाई',
    action4QuarterCmt: '4-पैडल सीएमटी करें',
    actionObserveRumination: 'जुगाली देखें',
    vetRecommendationsTitle: 'फार्म पर्यवेक्षक के लिए पशु चिकित्सा सिफारिशें',
    reportRecommendation1: 'शाम की दुहाई के दौरान प्राथमिकता पशुओं को अलग रखें।',
    reportRecommendation2: 'अचानक ध्वनिक गिरावट दिखाने वाले पशुओं के कॉलर फिटमेंट सत्यापित करें।',
    reportRecommendation3: 'उच्च THI अवधि में सभी दुग्ध पशुओं पर दुहाई के बाद एंटीसेप्टिक डिप लगाएं।',
    reportFootnote: '* GoDrishti एआई इंजन द्वारा उत्पन्न • CMT प्रोटोकॉल के अनुसार सत्यापित',
    reportFootnoteRight: 'पशुधन स्वास्थ्य बुद्धि प्रणाली',

    // Settings page
    settingsSubtitle: 'फार्म आर्किटेक्चर, सेंसर कैलिब्रेशन, भाषा प्राथमिकताएं और फार्म प्रबंधन',
    farmArchitectureTitle: 'फार्म ऑपरेटिंग आर्किटेक्चर',
    farmArchitectureDesc: 'चुनें कि डेयरी स्वचालित पार्लर सेंसर या किफायती उपकरण उपयोग करती है',
    activeModeLabel: 'सक्रिय',
    lowResourceModeDesc: 'कॉलर ध्वनिक इनफेरेंसिंग, भौतिक थन अवलोकन और 4-पैडल सीएमटी। EC/pH लैब SCC नहीं।',
    recommendedRuralLabel: 'ग्रामीण क्लस्टर के लिए अनुशंसित',
    connectedModeDesc: 'पूर्ण स्टैक IoT + स्वचालित मिल्किंग पार्लर। इनलाइन EC, pH और SCC सिंक्रोनाइज़ेशन।',
    recommendedCommercialLabel: 'वाणिज्यिक फार्म और शोध पशुधन के लिए',
    uiLanguageTitle: 'यूजर इंटरफेस भाषा',
    langEnglish: 'अंग्रेजी',
    langHindi: 'हिंदी',
    langMarathi: 'मराठी',
    calibrationThresholdsTitle: 'बायोमार्कर कैलिब्रेशन थ्रेशोल्ड',
    calibrationThresholdsDesc: 'मास्टाइटिस प्रारंभिक जोखिम संवेदनशीलता ऑफसेट समायोजित करें',
    savedLabel: 'सहेजा गया',
    tempDeviationLimitLabel: 'त्वचा तापमान विचलन सीमा (°C)',
    alertIfDeltaHint: 'Δ > इस मान पर अलर्ट',
    ruminationDropLabel: 'जुगाली ध्वनिक ड्रॉप (%)',
    ruminationDropHint: '7-दिन के औसत से नीचे',
    thiThresholdLabel: 'THI ताप तनाव सीमा',
    thiThresholdHint: 'मानक बोवाइन तनाव: ≥ 79',
    cowBaselineTempLabel: 'देशी गाय आधार तापमान (°C)',
    ds18b20CalibrationHint: 'DS18B20 त्वचा कैलिब्रेशन',
    buffaloBaselineTempLabel: 'भैंस आधार तापमान (°C)',
    resetToDefaultsBtn: 'डिफ़ॉल्ट पर रीसेट करें',
    saveCalibrationBtn: 'कैलिब्रेशन सहेजें',
    farmManagementTitle: 'फार्म प्रबंधन',
    farmManagementDesc: 'फार्म बनाएं और चुनें',
    newFarmBtn: 'नया फार्म',
    registerNewFarmTitle: 'नया फार्म पंजीकृत करें',
    farmNameLabel: 'फार्म का नाम *',
    farmNamePlaceholder: 'जैसे वैष्णवी डेयरी',
    farmCodeLabel: 'फार्म कोड *',
    farmCodePlaceholder: 'जैसे F01',
    locationOptionalLabel: 'स्थान (वैकल्पिक)',
    locationPlaceholder: 'जैसे आनंद, गुजरात, भारत',
    createFarmBtn: 'फार्म बनाएं',
    loadingFarmsLabel: 'बैकएंड से फार्म लोड हो रहे हैं…',
    noFarmsRegistered: 'अभी कोई फार्म पंजीकृत नहीं। ऊपर एक बनाएं।',
    availableFarmsLabel: 'उपलब्ध फार्म',
    activeBadge: 'सक्रिय',
    setActiveBtn: 'सक्रिय करें',
    activeFarmIdLabel: 'सक्रिय फार्म आईडी',
    resetDemoDataTitle: 'डेमो डेटा रीसेट करें',
    resetDemoDataDesc: 'प्रारंभिक पशु, सेंसर और मॉक रिकॉर्ड को डिफ़ॉल्ट पर पुनर्स्थापित करता है।',
    resetAllDataBtn: 'सभी डेटा रीसेट करें',

    // Udder Analysis page
    supportiveVisionBadge: 'सहायक दृष्टि मॉड्यूल',
    backendUploadBadge: 'बैकएंड अपलोड',
    udderAnalysisSubtitle: 'थन छवि आकलन में सहायता',
    animalLabel: 'पशु',
    udderStep1Title: 'चरण 1: पिछली थन की छवि कैप्चर या अपलोड करें',
    changePhotoBtn: 'फोटो बदलें',
    selectPhotoBtn: 'फोटो चुनें या कैमरा खोलें',
    photoFormatHint: 'JPG, PNG, WEBP · मोबाइल पर सीधे कैमरा',
    demoSampleLabel: 'या डेमो नमूना चुनें',
    uploadingToBackend: 'बैकएंड पर अपलोड हो रहा है…',
    runningCvModel: 'CV मॉडल चल रहा है…',
    uploadUdderImageBtn: 'थन छवि अपलोड करें',
    analyzeUdderImageBtn: 'थन छवि विश्लेषण करें',
    selectFileHint: 'अपने डिवाइस से फ़ाइल चुनें।',
    udderStep2Title: 'चरण 2: आकलन परिणाम',
    imageUploadedMsg: 'छवि बैकएंड पर अपलोड हुई',
    storedAtLabel: 'संग्रहीत',
    supportiveVisualAssessment: 'सहायक दृश्य आकलन',
    cvModelLabel: 'मॉडल',
    capturedLabel: 'कैप्चर',
    requiresFollowUp: 'फॉलो-अप आवश्यक: CMT और पशु चिकित्सा जांच से सत्यापित करें।',
    viewAnimalProfileLink: 'पशु प्रोफाइल देखें',
    newScanBtn: 'नया स्कैन',
    morphologicalRiskLabel: 'रूपात्मक जोखिम स्तर',
    confidenceLabel: 'विश्वसनीयता',
    cvObservationsLabel: 'CV अवलोकन',
    recommendedProtocolLabel: 'अनुशंसित प्रोटोकॉल',
    attachToProfileLink: 'पशु प्रोफाइल से जोड़ें',
    noScanYet: 'अभी कोई स्कैन नहीं हुआ।',
    noScanHint: 'छवि चुनें और "विश्लेषण करें" पर टैप करें।',

    // Sidebar / Header / MoreDrawer
    activeModeShort: 'सक्रिय मोड',
    lowResourceModeShort: 'कॉलर + फोन + सीएमटी',
    connectedModeShort: 'बहु-सेंसर + लैब SCC',
    livestockHealthGuard: 'पशुधन स्वास्थ्य रक्षक',
    sidebarFooterDisclaimer: 'एआई प्रारंभिक स्क्रीनिंग • पशु चिकित्सक का विकल्प नहीं।',
    selectFarmArchitecture: 'फार्म आर्किटेक्चर चुनें',
    farmArchitectureAdaptDesc: 'उपलब्ध उपकरणों के अनुसार सुविधाएं अनुकूलित होती हैं',
    lowResourceModeShortDesc: 'कॉलर, फोन अवलोकन और CMT पैडल। लैब/SCC आवश्यक नहीं।',
    connectedModeShortDesc: 'स्वचालित पार्लर, EC/pH सेंसर और SCC एकीकरण।',
    moreDrawerSubtitle: 'सभी डेयरी बुद्धि मॉड्यूल खोजें',
    modeLabel: 'मोड',
    descLiveMonitoring: 'MPU6050, DS18B20, MAX9814 सेंसर फीड',
    descAnalytics: 'गतिविधि, जुगाली, THI, जोखिम ट्रेंड',
    descAddData: 'मैन्युअल लॉग और फील्ड फॉर्म',
    descMilkData: 'उत्पादन, EC, pH और SCC इतिहास',
    descCmtTests: '4-पैडल स्कोरिंग और परिणाम',
    descHealthRecords: 'पशु चिकित्सा उपचार और फॉलो-अप',
    descUdderAnalysis: 'बहुविध दृश्य असममिति स्कैन',
    descDevices: 'स्मार्ट कॉलर, परिवेश नोड और बैटरी',
    descReports: 'पशुधन स्वास्थ्य सारांश और CSV',
    descFarmMap: 'GIS क्लस्टर जोखिम और फार्म स्थान',
    descSettings: 'थ्रेशोल्ड, प्रजाति आधार और सेंसर',
    descProfile: 'डेयरी ऑपरेटर और पशु चिकित्सा प्रमाण-पत्र',

    // ScientificDisclaimer
    clinicalProtocolsBadge: 'नैदानिक प्रोटोकॉल',
    sectionRumination: 'जुगाली',
    sectionSurfaceTemp: 'सतह तापमान',
    sectionUdderScan: 'थन स्कैन',
    sectionSccData: 'SCC डेटा',
    sectionScope: '7–14 दिन क्षेत्र',
    sectionDecisionSupport: 'निर्णय सहायता',

    // AI Health Signals extra
    computedLabel: 'गणना',
    scoreLabel: 'स्कोर',
    behaviorPendingDesc: 'मॉडल 3 व्यवहार एंडपॉइंट अभी नहीं जुड़ा है। गतिविधि और जुगाली विचलन संकेत यहां दिखेंगे।',
    observationWindowLabel: 'अवलोकन विंडो',

    // Dashboard extra
    openAlertsLabel: 'खुले अलर्ट',
    avgHerdYield: 'औसत झुंड उत्पादन',
    moderateRiskAnimals: 'मध्यम जोखिम',
    runCmt: 'सीएमटी चलाएं',
    scanUdder: 'थन स्कैन',
    aiContributingFactors: 'एआई योगदान कारक',
    fromBackendSorted: 'बैकएंड से — निर्माण तिथि अनुसार',
    rankedByRisk: 'बहुविध जोखिम स्कोर के अनुसार रैंक',
    lowResourceSmallholder: 'किफायती फार्म मोड',
    connectedMultiSensor: 'कनेक्टेड मल्टी-सेंसर',
    totalLabel: 'कुल',
    retryBtn: 'पुनः प्रयास',

    // Animals page
    profileAndRisk: 'प्रोफाइल और जोखिम',
    profileAndLiveData: 'प्रोफाइल और लाइव डेटा',
    ageLabel: 'आयु',
    lactationLabel: 'दुग्धावस्था',
    statusLabel: 'स्थिति',
    mastitisHxLabel: 'थनैला इतिहास',
    collarLabel: 'कॉलर',
    riskDriversLabel: 'जोखिम कारण',
    showingAnimals: 'दिखाए जा रहे हैं',
    ofLabel: 'में से',
    allRiskLevels: 'सभी जोखिम स्तर',
    allSpeciesCowsOnly: '🐄 केवल गायें',
    allSpeciesBuffaloOnly: '🐃 केवल भैंसें',
    herdRegistryDesc: 'डेयरी गाय और भैंस पशुधन स्वास्थ्य रजिस्ट्री',
    liveBackendDesc: 'लाइव बैकएंड डेटा',
    searchTagBreedPlaceholder: 'टैग आईडी, नस्ल खोजें…',
    refreshLabel: 'रीफ्रेश',
    viewLabel: 'देखें',
    breedNotSpecified: 'नस्ल निर्दिष्ट नहीं',
    tagIdLabel: 'टैग आईडी',

    // AnimalDetails
    recordCmtBtn: 'सीएमटी दर्ज करें',
    logMilkBtn: 'दूध लॉग करें',
    udderScanBtn: 'थन स्कैन',
    confirmatoryProtocol: 'पुष्टि मूल्यांकन प्रोटोकॉल',
    cmtPaddleCheck: 'अगली दुहाई पर सीएमटी पैडल जांच करें।',
    checkRearQuarters: 'पिछले थनों में स्थानीय गर्मी या कठोरता जांचें।',
    antisepticDip: 'दुहाई के बाद एंटीसेप्टिक डिप लगाएं।',
    baselineSkinTempLabel: 'आधार त्वचा तापमान',
    baselineRuminationLabel: 'आधार जुगाली',
    baselineActivityLabel: 'आधार गतिविधि',
    avgDailyMilkLabel: 'औसत दैनिक दूध',
    liveIotSensors: 'लाइव आईओटी कॉलर सेंसर',
    milkingRecordsTitle: 'दूध रिकॉर्ड और दूध गुणवत्ता',
    cmtHistoryTitle: 'सीएमटी 4-पैडल इतिहास',
    vetNotesTitle: 'पशु चिकित्सा नोट्स और उपचार',
    logTreatmentBtn: 'उपचार लॉग करें',
    observationLabel: 'अवलोकन',
    treatmentLabel: 'उपचार',
    vetLabel: 'डॉक्टर',
    followUpLabel: 'फॉलो-अप',
    computeRiskBtn: 'जोखिम की गणना करें',
    forecastLabel: 'पूर्वानुमान',
    riskScoreHistoryTitle: 'जोखिम स्कोर इतिहास (बैकएंड)',
    screeningEventTimeline: 'स्क्रीनिंग और घटना समयरेखा',
    earlyRiskScoreLabel: 'प्रारंभिक जोखिम स्कोर',
    collarAttachedLabel: 'स्मार्ट कॉलर जुड़ा',
    liveTelemetryBadge: 'लाइव टेलीमेट्री',
    barnThi: 'शेड THI',
    ambientTemp: 'परिवेश तापमान',
    humidityLabel: 'आर्द्रता',
    dimLabel: 'दुग्धावस्था दिन',
    unknown: 'अज्ञात',
    notPaired: 'जोड़ा नहीं',
    yesLabel: 'हाँ',
    noLabel: 'नहीं',

    // Analytics extra
    surfaceTempLabel: 'सतह तापमान (°C)',
    aiRuminationLabel: 'जुगाली (मिनट)',
    activityRawShort: 'गतिविधि सूचकांक',
    rangeAffectsFetch: '(रेंज सेंसर डेटा सीमा को प्रभावित करती है)',
    loadingBackendSensor: 'बैकएंड सेंसर डेटा लोड हो रहा है…',

    // Alerts extra
    reviewBtn: 'समीक्षा',
    demoDataBadge: 'डेमो डेटा',
    noFarmAlertData: 'कोई फार्म नहीं जुड़ा। अलर्ट डेटा के लिए फार्म असाइन करें।',
    foundLabel: 'अलर्ट मिले',
    severityLabel: 'गंभीरता',

    // AddData page
    addDataSubtitle: 'किसानों, डेयरी पर्यवेक्षकों और पैरा-पशु चिकित्सकों के लिए केंद्रीय फील्ड डेटा लॉगिंग',
    registerLivestockTitle: 'पशु पंजीकृत करें',
    registerLivestockDesc: 'नई गाय या भैंस को स्वास्थ्य प्रणाली में दर्ज करें और आधार रेखा कैलिब्रेट करें।',
    registerLivestockBadge: 'RFID / टैग',
    milkingRecordQualityTitle: 'दूध रिकॉर्ड और गुणवत्ता',
    milkingRecordQualityDesc: 'सुबह/शाम दूध उत्पादन, तापमान, EC, pH और SCC दर्ज करें।',
    milkingRecordBadge: 'दैनिक उत्पादन',
    cmtTestTitle: 'कैलिफोर्निया मास्टाइटिस टेस्ट (सीएमटी)',
    cmtTestDesc: '4-पैडल टेस्ट रीडिंग (LF, RF, LR, RR) सोमैटिक सेल जेलेशन के लिए।',
    cmtTestBadge: 'मानक फील्ड परीक्षण',
    vetLogTitle: 'पशु चिकित्सा उपचार लॉग',
    vetLogDesc: 'शारीरिक लक्षण, थन परीक्षण, पशु चिकित्सा निदान और उपचार दर्ज करें।',
    vetLogBadge: 'नैदानिक इतिहास',
    udderAsymmetryTitle: 'थन असममिति दृश्य विश्लेषण',
    udderAsymmetryDesc: 'पिछले थन का फोटो लें या अपलोड करें और सूजन, लालिमा और असममिता की जांच करें।',
    aiVisionBadge: 'एआई विजन स्कैन',
    launchCameraBtn: 'कैमरा और विजन मॉड्यूल खोलें',
    openFormBtn: 'फॉर्म खोलें',
    bestFieldPracticesTitle: 'सर्वोत्तम फील्ड प्रथाएं: कम-संसाधन मास्टाइटिस प्रोटोकॉल',
    stripCupTitle: '1. स्ट्रिप कप परीक्षण',
    stripCupDesc: 'दुहाई से पहले 2-3 छींटे काले कप में डालें। पानी जैसी या गुच्छेदार स्थिरता देखें।',
    cmtPaddleStepTitle: '2. 4-पैडल सीएमटी',
    cmtPaddleStepDesc: 'दूध और अभिकर्मक बराबर भाग (2 मिली) मिलाएं। 20 सेकंड हिलाएं। जेल बनना उच्च सोमैटिक सेल दर्शाता है।',
    postMilkingDipTitle: '3. दुहाई के बाद टीट बैरियर डिप',
    postMilkingDipDesc: '0.5% आयोडोफोर या हर्बल एंटीसेप्टिक से तुरंत दुहाई के बाद डिप करें। 30 मिनट खड़ा रखें।',

    // MilkData page
    showingRecords: 'दिखाए जा रहे हैं',
    deleteMilkConfirm: 'यह दूध रिकॉर्ड हटाएं?',
    milkDeletedToast: 'दूध रिकॉर्ड हटाया गया',
    noMilkFoundTitle: 'कोई दूध रिकॉर्ड नहीं मिला।',
    clickToRecordMilk: '"दूध दर्ज करें" पर क्लिक करें।',
    lowResourceModeTag: 'किफायती मोड',

    // CMT page
    showingLabel: 'दिखाए जा रहे हैं',
    deleteCmtConfirm: 'यह सीएमटी रिकॉर्ड हटाएं?',
    cmtDeletedToast: 'सीएमटी रिकॉर्ड हटाया गया',
    noCmtFoundTitle: 'कोई सीएमटी रिकॉर्ड नहीं मिला।',

    // HealthRecords page
    deleteHealthConfirm: 'यह स्वास्थ्य और पशु चिकित्सा रिकॉर्ड हटाएं?',
    healthDeletedToast: 'रिकॉर्ड हटाया गया',
    noHealthFoundTitle: 'कोई स्वास्थ्य रिकॉर्ड नहीं मिला।',
    clickLogVet: '"पशु चिकित्सा उपचार दर्ज करें" पर क्लिक करें।',
    subjectLabel2: 'विषय',

    // LiveMonitoring extra
    noSensorDataAnimal: 'इस पशु के लिए अभी कोई सेंसर डेटा नहीं मिला।',

    // UdderAnalysis extra
    sciConstraintTitle: 'वैज्ञानिक प्रतिबंध और अस्वीकरण',
    sciConstraintDesc: 'यह दृश्य मूल्यांकन केवल सहायक है — स्वतंत्र पशु चिकित्सा निदान नहीं। थन की आकृति नस्ल, दुग्धावस्था और दुहाई की परिपूर्णता के अनुसार भिन्न होती है। हमेशा सीएमटी या एससीसी से सत्यापित करें।',
    liveInfoDesc: 'लाइव मोड में छवियाँ बैकएंड पर अपलोड होती हैं। सीवी विश्लेषण अभी स्टब है। प्रीसेट URL अपलोड नहीं किए जा सकते।',
    cvAnalysisPendingDesc: 'CV पाइपलाइन अभी स्टब है। परिणाम तब दिखेंगे जब मॉडल जुड़ेगा।',
    possibleSwelling: 'संभावित सूजन',
    possibleRedness: 'संभावित लालिमा',
    visibleAsymmetry: 'दृश्य असममिता',
    cvConfidence: 'सीवी विश्वसनीयता',
    cvLesions: 'घाव',
    cvDischarge: 'स्राव',
    statusProcessed: 'प्रसंस्कृत (डेमो)',
    requiresFollowUpTitle: 'फॉलो-अप आवश्यक',
    pleaseUploadPhoto: 'कृपया पहले थन की फोटो अपलोड या चुनें',
    pleaseSelectAnimal: 'कृपया पहले पशु चुनें',

    // Devices extra
    onlineOutOf: 'ऑनलाइन',
    signalConnected: '-68 dBm',
    signalWeak: 'कमजोर',

    // FarmMap extra
    coopHubsMapped: '4 सहकारी हब मैप किए',
    farmMapGeographicDesc: 'भौगोलिक पशुधन जोखिम दृश्य, THI और शेड क्लस्टर',
    headsLabel: 'पशु',

    // Reports extra
    requireCmtConfirmation: 'सीएमटी पुष्टि आवश्यक',
    cowsLabel: 'गायें',
    buffaloesPluralLabel: 'भैंसें',
    generatedOn: 'उत्पन्न',
    auditId: 'ऑडिट आईडी',
    farmClusterName: 'आनंद डेयरी सहकारी क्लस्टर',
    farmClusterLocation: 'गुजरात, भारत • सुपरवाइज्ड फील्ड पायलट',

    // Settings extra
    activeColonLabel: 'सक्रिय:',
    uniqueShortId: 'अद्वितीय शॉर्ट आईडी',
    connectedToApi: 'से जुड़ा',
    calibrationSavedToast: 'कैलिब्रेशन थ्रेशोल्ड डिवाइस पर सहेजे गए',
    calibrationResetToast: 'थ्रेशोल्ड डिफ़ॉल्ट पर रीसेट किए गए',
    demoDataResetToast: 'डेमो डेटा डिफ़ॉल्ट स्थिति में पुनर्स्थापित',
    farmCreatedToast: 'फार्म बना',
    activeFarmUpdatedToast: 'सक्रिय फार्म अपडेट हुआ',
    languageSetToast: 'भाषा सेट की गई',
    resetDemoConfirm: 'सभी डेटा मूल डेमो स्थिति में रीसेट करें? नए बनाए गए सभी रिकॉर्ड हट जाएंगे।',
    farmNameCodeRequired: 'फार्म का नाम और कोड आवश्यक हैं।',
    failedCreateFarm: 'फार्म बनाने में विफल',
    farmCreatedMsg: 'फार्म बनाया गया',

    // Profile extra
    lowResourceModeValue: 'किफायती फार्म मोड',
    connectedModeValue: 'कनेक्टेड मोड',
    goDrishtiUser: 'GoDrishti उपयोगकर्ता',
    profileSubtitle: 'GoDrishti डेयरी पशु स्वास्थ्य प्रणाली',

    // Modal form labels
    selectAnimalModalLabel: 'पशु चुनें *',
    backendLabel2: 'बैकएंड',
    loadingAnimalsLabel: 'पशु लोड हो रहे हैं…',
    noBackendAnimalsMsg: 'बैकएंड पर कोई पशु नहीं मिला। फार्म असाइनमेंट जांचें।',
    dataSourceLabel: 'डेटा स्रोत',
    farmerObservation: 'किसान अवलोकन',
    fieldKitPaddle: 'फील्ड किट / पैडल',
    labSubmission: 'लैब सबमिशन',
    veterinaryClinic: 'पशु चिकित्सालय',
    milkingDateLabel: 'दुहाई तारीख',
    milkYieldLabel: 'दूध उत्पादन (लीटर) *',
    milkTempCLabel: 'दूध तापमान (°C)',
    electricalCondLabel: 'विद्युत चालकता (mS/cm)',
    electricalCondHint: 'स्वस्थ: 5.0 – 5.5',
    milkPhLabel: 'दूध pH',
    milkPhHint: 'स्वस्थ: 6.6 – 6.8',
    sccCellsLabel: 'SCC (×10³ cells/mL)',
    sccNotMeasured: 'कॉलर द्वारा नहीं मापा — लैब/रैपिड टेस्ट परिणाम दर्ज करें।',
    visualObsLabel: 'दृश्य अवलोकन / नोट्स',
    saveMilkDataBtn: 'दूध डेटा सहेजें',
    testDateLabel: 'परीक्षण तारीख',
    cmtPaddleReadingsLabel: 'सीएमटी 4-पैडल रीडिंग',
    testerNameLabel: 'परीक्षक का नाम / भूमिका',
    fieldNotesLabel: 'फील्ड नोट्स',
    saveCmtRecordBtn: 'सीएमटी रिकॉर्ड सहेजें',
    physicalObservationLabel: 'शारीरिक अवलोकन *',
    suspectedConditionLabel: 'संदिग्ध स्थिति',
    treatmentInterventionLabel: 'उपचार / हस्तक्षेप',
    vetNotesModalLabel: 'पशु चिकित्सा नोट्स',
    vetParavetLabel: 'पशु चिकित्सक / पैरा-वेट',
    followUpDateLabel: 'फॉलो-अप तारीख',
    udderTempLabel: 'थन तापमान (°C)',
    saveHealthRecordBtn: 'स्वास्थ्य रिकॉर्ड सहेजें',
    registerNewLivestockTitle: 'नया पशु पंजीकृत करें',
    recordMilkQualityTitle: 'दूध और गुणवत्ता दर्ज करें',
    cmtFourQuarterTitle: 'कैलिफोर्निया मास्टाइटिस टेस्ट (सीएमटी) 4-पैडल लॉग',
    vetObsTreatmentTitle: 'पशु चिकित्सा अवलोकन और उपचार लॉग',
    savesToBackendBadge: '🟢 बैकएंड पर सहेजता है',
    demoLocalBadge: '🟡 डेमो मोड (localStorage)',
    farmLinkedMsg: 'पशु बैकएंड में बनाया जाएगा और इस फार्म से जुड़ेगा।',
    baselineNotice: 'DS18B20 त्वचा तापमान और MAX9814 जुगाली ध्वनि की आधार रेखा पहले 7 दिनों में कैलिब्रेट होगी।',
    registerAnimalBtn2: 'पशु पंजीकृत करें',
    healthyLabel: 'स्वस्थ',
    investigateLabel: 'जांचें',
    clearLabel: 'स्पष्ट',
    precipitateLabel: 'अवक्षेप',
    gelLabel: 'जेल',

    // Toast messages
    toastAlertAcknowledged: 'अलर्ट स्वीकार किया',
    toastAlertResolved: 'अलर्ट हल किया गया',
    toastFailedAcknowledge: 'अलर्ट स्वीकार करने में विफल',
    toastFailedResolve: 'अलर्ट हल करने में विफल',
    toastDashboardRefreshed: 'डैशबोर्ड रीफ्रेश हुआ',
    toastRiskComputed: 'जोखिम गणना हुई',
    toastFailedRisk: 'जोखिम गणना विफल',
    toastAnimalRegistered: 'पशु पंजीकृत!',
    toastFailedRegister: 'पशु पंजीकरण विफल',
    toastMilkSaved: 'दूध रिकॉर्ड दर्ज किया गया',
    toastFailedMilkSave: 'दूध डेटा सहेजने में विफल',
    toastCmtSaved: 'सीएमटी टेस्ट सहेजा गया',
    toastFailedCmtSave: 'सीएमटी रिकॉर्ड सहेजने में विफल',
    toastHealthSaved: 'स्वास्थ्य रिकॉर्ड दर्ज किया गया',
    toastFailedHealthSave: 'स्वास्थ्य रिकॉर्ड सहेजने में विफल',
    toastSwitchedConnected: 'कनेक्टेड फार्म मोड पर स्विच किया (उन्नत लैब और सेंसर सक्षम)',
    toastSwitchedLowResource: 'किफायती मोड पर स्विच किया (कॉलर, मोबाइल और सीएमटी केंद्रित)',
    toastDevicePingSuccess: 'डिवाइस ने प्रतिक्रिया दी! विलंबता: 42ms (BLE Mesh)',
    toastDeviceStatus: 'डिवाइस स्थिति सेट की गई',
    toastReportDownloaded: 'रिपोर्ट PDF/CSV के रूप में डाउनलोड हुई',
    toastAnalyticsCsvLive: 'एनालिटिक्स CSV बैकएंड डेटा से निर्यात हुई',
    toastAnalyticsCsvDemo: 'एनालिटिक्स CSV निर्यात हुई (डेमो डेटा)',
    toastUdderUploaded: 'थन छवि बैकएंड पर अपलोड हुई',
    toastUdderAssessed: 'सहायक दृश्य मूल्यांकन पूर्ण',
  },
  mr: {
    appName: 'GoDrishti',
    appSubtitle: 'एआय-आधारित दुग्ध जनावरे मस्टायटिस (स्तनदाह) पूर्वसूचना प्रणाली',
    demoDataNotice: 'डेमो डेटा — भारतीय डेअरी फार्म निरंतर निरीक्षण व चाचण्या',
    lowResourceMode: 'किफायतशीर फार्म मोड',
    connectedMode: 'कनेक्टेड फार्म मोड',
    modeDescription: 'कॉलर, स्मार्टफोन आणि सीएमटी द्वारे अल्प-खर्चिक व्यवस्थापन',

    dashboard: 'डॅशबोर्ड',
    animals: 'जनावरे व्यवस्थापन',
    animalDetails: 'जनावर तपशील',
    liveMonitoring: 'थेट निरीक्षण',
    analytics: 'विश्लेषण (अ‍ॅनालिटिक्स)',
    alerts: 'सूचना (अलर्ट्स)',
    addData: 'डेटा जोडा',
    milkData: 'दूध नोंद',
    cmtTests: 'सीएमटी चाचणी',
    healthRecords: 'आरोग्य नोंद',
    udderAnalysis: 'कासेचे (थन) विश्लेषण',
    devices: 'उपकरणे',
    reports: 'अहवाल (रिपोर्ट्स)',
    farmMap: 'शेत नकाशा / जीआयएस',
    settings: 'सेटिंग्ज',
    profile: 'माझे प्रोफाइल',
    more: 'अधिक पर्याय',

    cows: 'गाई',
    buffaloes: 'म्हशी',
    allSpecies: 'सर्व जनावरे',
    cow: 'गाय',
    buffalo: 'म्हीस',

    riskOverview: 'जोखीम तपासणी आढावा',
    noRisk: 'अलर्ट उंबरठ्याखाली',
    lowRisk: 'कमी धोका (26–50)',
    moderateRisk: 'मध्यम धोका (51–75)',
    highRisk: 'जास्त धोका (76–100)',
    riskScore: 'जोखीम गुण',
    riskTrend: 'जोखीम कल',
    contributingFactors: 'जोखीम घटक व बदल',
    explainability: 'स्पष्टीकरणयोग्य एआय कारणे',
    topPriorityAnimals: 'तातडीने लक्ष देण्याची जनावरे',

    herdOverview: 'गोठा आढावा',
    totalAnimals: 'एकूण जनावरे',
    connectedDevices: 'सक्रिय स्मार्ट कॉलर',
    activeAlerts: 'सक्रिय अलर्ट',
    activity: 'हालचाल निर्देशांक',
    movement: 'मानेची हालचाल',
    surfaceTemperature: 'त्वचेचे तापमान',
    aiInferredRumination: 'एआय-अनुमानित रवंथ',
    chewing: 'चावण्याचा आवाज',
    ambientTemperature: 'बाहेरील तापमान',
    humidity: 'गोठ्यातील आर्द्रता',
    thi: 'टीएचआय (उष्णता ताण)',
    milkYield: 'दूध उत्पादन (लिटर)',
    electricalConductivity: 'विद्युत वाहकता',
    ph: 'दुधाचा सामू (pH)',
    scc: 'एससीसी (सोमॅटिक सेल)',

    measured: 'मोजलेले',
    estimated: 'अंदाजित',
    aiInferred: 'एआय-अनुमानित',

    quickActions: 'जलद कृती',
    addAnimal: 'नवीन जनावर नोंदवा',
    recordMilk: 'दूध नोंद जोडा',
    newCmtTest: 'सीएमटी चाचणी नोंदवा',
    addHealthRecord: 'आरोग्य नोंद लिहा',
    viewAnalytics: 'विश्लेषण पहा',
    acknowledge: 'मान्य करा',
    review: 'तपासा',
    resolve: 'निवारण झाले',
    viewAnimal: 'जनावर पहा',
    search: 'टॅग, नाव किंवा जात शोधा...',
    filter: 'फिल्टर',
    save: 'जतन करा',
    cancel: 'रद्द करा',
    delete: 'हटवा',
    confirm: 'खात्री करा',
    retry: 'पुन्हा प्रयत्न करा',

    scientificNotice: 'वैज्ञानिक आणि वैद्यकीय नियम',
    ruminationNote: 'कॉलर मायक्रोफोन आवाजावरून रवंथ ओळखतो; थेट मोजमाप नाही.',
    tempNote: 'DS18B20 सेन्सर फक्त त्वचेचे तापमान मोजतो, शरीराचे आंतरिक नाही.',
    udderNote: 'कासेचे फोटो विश्लेषण केवळ सहाय्यक साधन आहे, स्वतंत्र निदान नाही.',
    sccNote: 'एससीसी लॅब किंवा चाचणी किटमधून मॅन्युअली नोंदवले जाते.',
    validationNote: 'हे मॉडेल ७–१४ दिवस आधीच्या जोखमीच्या चाचणीसाठी तयार केले आहे.',
    vetDisclaimer: 'GoDrishti केवळ प्राथमिक इशारा देते; हे पशुवैद्यकीय डॉक्टरांचा पर्याय नाही।',

    alertPriority: 'प्राधान्य',
    critical: 'अत्यंत गंभीर',
    high: 'गंभीर',
    medium: 'मध्यम',
    low: 'कमी',
    recentAlerts: 'नुकतेच आलेले धोक्याचे इशारे',

    leftFront: 'डावे पुढचे (LF)',
    rightFront: 'उजवे पुढचे (RF)',
    leftRear: 'डावे मागचे (LR)',
    rightRear: 'उजवे मागचे (RR)',
    overallResult: 'एकूण सीएमटी निकाल',

    // AI Signal UI
    aiHealthSignals: 'एआय आरोग्य संकेत',
    model1Label: 'मॉडेल 1 — स्तनदाह पूर्वसूचना',
    model1SubLabel: 'नियम-आधारित स्क्रीनिंग इंजिन',
    model1Disclaimer: 'विकास मॉडेल — नैदानिक सत्यापन आवश्यक.',
    model1Signal7d: '7-दिवस पूर्वसूचना संकेत',
    model1Signal14d: '14-दिवस पूर्वसूचना संकेत',
    model2Label: 'मॉडेल 2 — कासे प्रतिमा एआय',
    model2SubLabel: 'दृश्य मूल्यमापन सहाय्य',
    model3Label: 'मॉडेल 3 — वर्तन संकेत',
    model3SubLabel: 'रवंथ आणि हालचाल विचलन',
    signalElevated: 'उन्नत',
    signalBelowThreshold: 'अलर्ट उंबरठ्याखाली',
    signalInsufficient: 'अपुरा डेटा',
    signalInsufficientDetail: 'अंदाजासाठी पुरेसा ऐतिहासिक डेटा उपलब्ध नाही.',
    signalPending: 'एकीकरण प्रलंबित',
    behaviorNormal: 'सामान्य',
    behaviorMildDeviation: 'सौम्य विचलन',
    behaviorModerateDeviation: 'मध्यम विचलन',
    behaviorHighDeviation: 'उच्च विचलन',
    provenanceManual: 'मॅन्युअल',
    provenanceSensor: 'सेन्सर',
    provenanceImported: 'आयात केलेले',
    provenanceAiModel: 'एआय मॉडेल',
    provenanceSynthetic: 'सिंथेटिक विकास डेटा',

    // Dashboard
    priorityConfirmation: 'प्राधान्य पुष्टी',
    requireCmtExam: 'सीएमटी / तपासणी आवश्यक',
    noElevatedSignal: 'कोणताही उन्नत संकेत नाही',
    lowSignalCount: 'कमी संकेत',
    deviceLocalBadge: 'डिव्हाइस-स्थानीय',
    lowBattery: 'कमी बॅटरी',
    rapidFieldEntry: 'जलद क्षेत्र डेटा नोंद',
    viewAllAnimals: 'सर्व जनावरे पहा',
    viewAllAlerts: 'सर्व अलर्ट पहा',
    aiSignalDistLive: 'एआय स्क्रीनिंग संकेत वितरण (बॅकएंड)',
    aiSignalDistDemo: 'एआय स्क्रीनिंग संकेत वितरण — निदान नाही',
    aiModelSignalLabel: 'A — एआय मॉडेल संकेत',
    aiModelSignalDesc: 'नियम-आधारित स्क्रीनिंग इंजिन आउटपुट. निदान नाही.',
    confirmatoryRequiredLabel: 'B — पुष्टी आवश्यक',
    confirmatoryRequiredDesc: 'सीएमटी, एससीसी किंवा पशुवैद्यकीय तपासणीद्वारे पुष्टी करा.',
    noActiveAlerts: 'सध्या कोणतेही सक्रिय अलर्ट नाहीत.',
    noFarmConnected: 'कोणताही फार्म जोडलेला नाही. सेटिंग्जमध्ये जाऊन फार्म नियुक्त करा.',
    appBannerSubtitle: 'बहुविध लवकर जोखीम स्क्रीनिंग — फक्त एआय संकेत, निदान नाही.',
    computing: 'गणना होत आहे…',
    refreshSignalsBtn: 'जोखीम इंजिन चालवा (सर्व जनावरे)',
    demoDataLabel: 'डेमो डेटा',
    liveLabel: 'लाइव्ह',

    // Navigation / page strings
    backToAnimals: 'जनावरे यादीकडे परत',
    returnToHerdList: 'गोठा यादीकडे परत',
    animalNotFound: 'जनावर सापडले नाही',
    animalNotFoundDesc: 'विनंती केलेले जनावर प्रोफाइल अस्तित्वात नाही.',
    couldNotLoadAnimal: 'जनावर लोड होऊ शकले नाही',
    sensorDataTab: 'सेन्सर डेटा',
    milkTab: 'दूध',
    healthCmtTab: 'आरोग्य आणि सीएमटी',
    riskHistoryTab: 'संकेत इतिहास',
    sensorReadingHistory: 'सेन्सर रीडिंग इतिहास',
    mostRecentSensorData: 'नवीनतम कॉलर + गोठा सेन्सर डेटा',
    refreshBtn: 'रीफ्रेश',
    noSensorReadings: 'अद्याप कोणतेही सेन्सर रीडिंग उपलब्ध नाही. कॉलर डेटा आल्यावर दिसेल.',
    noMilkRecords: 'अद्याप कोणतीही दूध नोंद नाही.',
    noCmtRecords: 'अद्याप कोणतीही सीएमटी नोंद नाही.',
    noHealthRecords: 'अद्याप कोणतीही आरोग्य नोंद नाही.',
    noSignalHistory: 'अद्याप कोणताही संकेत इतिहास उपलब्ध नाही.',
    logMilking: 'दूध नोंदवा',
    newCmt: 'नवीन सीएमटी',
    logTreatment: 'उपचार नोंदवा',
    noFarmWarning: 'कोणताही फार्म जोडलेला नाही. सेटिंग्जमध्ये जा किंवा व्यवस्थापकाशी संपर्क करा.',
    noFarmWarningAnimals: 'कोणताही फार्म नियुक्त नाही. व्यवस्थापकाशी संपर्क करा किंवा सेटिंग्जमध्ये जा.',
    noFarmWarningAnalytics: 'कोणताही फार्म जोडलेला नाही. थेट विश्लेषणासाठी फार्म नियुक्त करा.',
    noFarmWarningMonitoring: 'कोणताही फार्म नियुक्त नाही. सेन्सर डेटासाठी कनेक्टेड फार्म खाते आवश्यक आहे.',
    noAnimalsFound: 'कोणतेही जनावर सापडले नाही.',
    noAnimalsFoundLive: 'या फार्मवर अद्याप कोणतेही जनावर नोंदवले नाही.',
    noAnimalsFoundFilter: 'फिल्टर बदलून पहा.',
    addAnimalsLink: 'जनावरे जोडा →',
    loadingSensorData: 'बॅकएंड सेन्सर डेटा लोड होत आहे…',
    noSignalAvailable: 'अद्याप कोणताही संकेत डेटा उपलब्ध नाही.',
    loadingRiskData: 'जोखीम डेटा लोड होत आहे…',

    // AI Health Signals
    currentScreeningSignal: 'सध्याचा स्क्रीनिंग संकेत',
    ruleBasedEngineOutput: 'नियम-आधारित इंजिन आउटपुट',
    contributingFactorsLabel: 'योगदान देणारे घटक',
    allParamsNormal: 'सर्व मापदंड सामान्य मर्यादेत आहेत.',
    recommendedActionLabel: 'शिफारस केलेली कृती',
    temporalForecastingSignals: 'कालिक पूर्वसूचना संकेत',
    notYetIntegrated7d: 'gorakshak_forecast_7d_xgb_v2 — अद्याप एकत्रित नाही',
    notYetIntegrated14d: 'gorakshak_forecast_14d_xgb_v2 — अद्याप एकत्रित नाही',
    windowComputedLabel: 'विंडो',
    imageStoredAt: 'प्रतिमा साठवली',
    cvAnalysisPending: 'मॉडेल 2 जोडल्यावर CV विश्लेषण दिसेल.',
    correlateWithCmt: 'सीएमटी किंवा पशुवैद्यकीय एससीसी तपासणीशी सत्यापित करा.',
    noUdderImageUploaded: 'या जनावरासाठी अद्याप कोणतीही प्रतिमा अपलोड केलेली नाही, किंवा मॉडेल 2 अद्याप जोडलेले नाही.',
    udderUploadViaPage: 'कास विश्लेषण पृष्ठावरून प्रतिमा अपलोड करा.',
    udderImageDisclaimer: 'कास प्रतिमा मूल्यमापन केवळ सहाय्यक आहे — स्वतंत्र पशुवैद्यकीय निदान नाही.',
    behaviorIndependentDisclaimer: 'वर्तन संकेत एक स्वतंत्र निरीक्षण आहे. हे स्तनदाह संभाव्यता दर्शवत नाही.',
    independentSignalsNotice: 'खालील तीन संकेत स्वतंत्र आहेत. त्यांची सरासरी काढली जात नाही आणि ते एकत्रित निदान संभाव्यता तयार करत नाहीत.',
    refreshSignals: 'संकेत रीफ्रेश करा',
    computingLabel: 'गणना होत आहे…',

    // Animal registration form
    animalPhotoLabel: 'जनावराचा फोटो',
    animalPhotoHint: 'ओळखीसाठी जनावराचा फोटो अपलोड करा (पर्यायी)',
    selectPhoto: 'फोटो निवडा',
    removePhoto: 'फोटो काढा',
    replacePhoto: 'फोटो बदला',
    photoPreview: 'फोटो पूर्वावलोकन',
    registerAnimalBtn: 'जनावर नोंदवा',
    tagRfid: 'टॅग / RFID *',
    nameIdentifier: 'नाव / ओळखकर्ता *',
    speciesLabel: 'प्रजाती *',
    breedLabel: 'जात *',
    ageYears: 'वय (वर्षे)',
    lactationNumber: 'दुग्धावस्था क्रमांक',
    daysInMilk: 'दुग्धावस्था दिवस',
    avgYield: 'सरासरी उत्पादन (लिटर/दिवस)',
    collarId: 'स्मार्ट कॉलर ID',
    farmShedCluster: 'फार्म / शेड क्लस्टर',
    baselineCalibrationNotice: 'DS18B20 त्वचा तापमान आणि MAX9814 रवंथ ध्वनी आधाररेखा मूल्ये पहिल्या ७ दिवसांत कॅलिब्रेट होतील.',

    // Common UI
    settingsLink: 'सेटिंग्ज',
    noFarmConnectedTitle: 'कोणताही फार्म जोडलेला नाही',
    noFarmConnectedDesc: 'तुमच्या खात्याला कोणताही फार्म नियुक्त केलेला नाही. सेटिंग्जमध्ये जा किंवा व्यवस्थापकाशी संपर्क करा.',

    // Login / Register
    signInHeading: 'तुमच्या खात्यात साइन इन करा',
    emailAddressLabel: 'ईमेल पत्ता',
    emailPlaceholder: 'shetkari@vaishnavidairy.in',
    passwordLabel: 'पासवर्ड',
    signingInLabel: 'साइन इन होत आहे…',
    signInBtn: 'साइन इन',
    newToGoDrishti: 'GoDrishti वर नवीन आहात?',
    createAccountLink: 'खाते तयार करा',
    backendLabel: 'बॅकएंड',
    errorEmailRequired: 'ईमेल आणि पासवर्ड आवश्यक आहेत.',
    errorInvalidCredentials: 'चुकीचा ईमेल किंवा पासवर्ड.',
    errorCannotReachServer: 'सर्व्हरशी जोडता येत नाही. बॅकएंड स्थिती तपासा.',
    errorLoginFailed: 'साइन इन अयशस्वी. पुन्हा प्रयत्न करा.',
    errorUnexpected: 'अनपेक्षित त्रुटी. पुन्हा प्रयत्न करा.',
    createAccountHeading: 'खाते तयार करा',
    accountCreatedMsg: 'खाते तयार झाले! लॉगिनकडे पुनर्निर्देशित होत आहे…',
    fullNameLabel: 'पूर्ण नाव *',
    emailLabel: 'ईमेल *',
    passwordPlaceholderMinChar: 'किमान 6 अक्षरे',
    phoneOptionalLabel: 'फोन (पर्यायी)',
    roleLabel: 'भूमिका',
    roleFarmer: 'शेतकरी',
    roleVet: 'पशुवैद्य',
    roleAdmin: 'प्रशासक',
    creatingAccountLabel: 'खाते तयार होत आहे…',
    createAccountBtn: 'खाते तयार करा',
    alreadyHaveAccount: 'आधीच खाते आहे?',
    signInLink: 'साइन इन करा',
    errorNameEmailRequired: 'नाव, ईमेल आणि पासवर्ड आवश्यक आहेत.',
    errorPasswordTooShort: 'पासवर्ड किमान 6 अक्षरांचा असावा.',
    errorEmailExists: 'या ईमेलसह आधीच खाते आहे.',
    signOutBtn: 'साइन आउट',

    // Alerts page
    alertsSubtitleLive: 'बॅकएंड जोखीम इंजनकडून रिअल-टाइम अलर्ट',
    alertsSubtitleDemo: 'लवकर बायोमार्कर विचलनासाठी स्वयंचलित सूचना',
    acknowledgeAllActive: 'सर्व सक्रिय मान्य करा',
    alertsDemoNotice: 'अलर्ट स्थानिक डेमो स्टोरेजमधून आहेत. खरे अलर्टसाठी बॅकएंडशी जोडा.',
    filterSeverityLabel: 'तीव्रता',
    filterStatusLabel: 'स्थिती',
    filterAll: 'सर्व',
    statusOpen: 'उघडे',
    statusAcknowledged: 'मान्य',
    statusResolved: 'निवारण',
    statusFalsePositive: 'खोटे पॉझिटिव्ह',
    foundAlertsCount: 'अलर्ट सापडले',
    noAlertsFound: 'कोणतेही अलर्ट सापडले नाहीत.',
    allVitalsNormal: 'सर्व जनावरे सामान्य आहेत.',
    animalIdLabel: 'जनावर ID',
    markFalsePositive: 'खोटे पॉझिटिव्ह',
    noAlertsMatchCriteria: 'निकषांशी जुळणारे अलर्ट नाहीत.',
    allVitalsAndNodesNormal: 'सर्व जनावरे आणि कॉलर नोड सामान्य आहेत.',
    subjectLabel: 'विषय',

    // Analytics page
    analyticsSubtitleLive: 'थेट बॅकएंड सेन्सर ट्रेंड · पृष्ठभाग तापमान, रवंथ, हालचाल, THI आणि जोखीम',
    analyticsSubtitleDemo: 'बहु-बायोमार्कर पूर्वसूचना ट्रेंड · डेमो डेटा',
    exportCsv: 'CSV निर्यात करा',
    analyticsDemoNotice: 'चार्ट स्थिर मॉक डेटा वापरतात. VITE_DEMO_MODE=false करा.',
    selectAnimalLabel: 'जनावर निवडा',
    loadingLabel: 'लोड होत आहे…',
    herdAverageOption: 'गोठा सरासरी',
    noSensorDataForAnimal: 'या जनावरासाठी अद्याप सेन्सर डेटा नाही.',
    chartTitleSurfaceTemp: 'त्वचा पृष्ठभाग तापमान विरुद्ध परिवेश',
    chartSubtitleSurfaceTemp: 'DS18B20 त्वचा प्रोब विरुद्ध SHT31-D गोठा नोड (°C)',
    chartTitleRumination: 'एआय-अनुमानित रवंथ (मिनिट/दिवस)',
    chartSubtitleRumination: 'MAX9814 चावण्याच्या आवाजावरून अनुमानित',
    chartTitleActivity: 'हालचाल / माने गती निर्देशांक',
    chartSubtitleActivity: 'MPU6050 एक्सेलेरोमीटर कच्चा स्कोर',
    chartTitleRiskScoreLive: 'जोखीम स्कोर इतिहास (0–100)',
    chartTitleRiskScoreDemo: 'सतत गोठा लवकर जोखीम ट्रेंड (0–100)',
    chartSubtitleRiskLive: 'बॅकएंड जोखीम इंजिन आउटपुट',
    chartSubtitleRiskDemo: 'समग्र बहुविध जोखीम निर्देशांक',
    aiIndexBadge: 'एआय निर्देशांक',
    chartTitleThi: 'गोठा THI (तापमान-आर्द्रता निर्देशांक)',
    chartSubtitleThi: 'SHT31-D नोडकडून — ताण उंबरठा: मध्यम >68, उच्च >72',

    // CMT page
    cmtSubtitle: 'कॅलिफोर्निया मास्टायटिस चाचणी (सीएमटी) 4-पॅडल जेलेशन स्क्रीनिंग',
    filterLivestockLabel: 'जनावरे फिल्टर करा',
    allHerdRecordsOption: 'सर्व गोठा नोंदी',
    showingPaddleEvals: 'पॅडल मूल्यमापन दाखवत आहे',
    dateLabel: 'तारीख',
    evaluatorLabel: 'मूल्यांकक',
    paddleReadingsLabel: '4-पॅडल रीडिंग',
    noteLabel: 'नोंद',
    normalSomaticRange: 'सामान्य सोमॅटिक सेल्युलर रेंज',
    suspectedSccElevation: 'संशयास्पद सोमॅटिक सेल वाढ',
    cmtEmptyHint: '"सीएमटी चाचणी नोंदवा" वर क्लिक करा.',

    // Devices page
    devicesSubtitle: 'आयओटी स्मार्ट कॉलर नोड (MPU6050, DS18B20, MAX9814) आणि SHT31-D गोठा टेलीमेट्री',
    devicesOnlineCount: 'ऑनलाइन',
    assignedSubjectLabel: 'नियुक्त जनावर',
    unassignedSpareNode: 'नियुक्त नाही (स्पेअर नोड)',
    batteryChargeLabel: 'बॅटरी चार्ज',
    firmwareLabel: 'फर्मवेअर',
    sensorsLabel: 'सेन्सर',
    lastTelemetrySyncLabel: 'शेवटचे टेलीमेट्री सिंक',
    pingingLabel: 'पिंग होत आहे...',
    pingNodeBtn: 'नोड पिंग करा',
    signalStrengthLabel: 'सिग्नल',

    // FarmMap page
    farmMapSubtitle: 'भौगोलिक जनावरे जोखीम दृश्य, THI आणि शेड क्लस्टर',
    indianDairyClusters: 'भारतीय डेअरी फार्म क्लस्टर',
    clickClusterHint: 'टेलीमेट्री पाहण्यासाठी क्लस्टर नोडवर क्लिक करा',
    nationalTelemetryNetwork: 'राष्ट्रीय डेअरी टेलीमेट्री नेटवर्क',
    simulatedGeoNodes: 'सिम्युलेटेड जियो-नोड',
    clusterProfileLabel: 'क्लस्टर प्रोफाइल',
    livestockCensusLabel: 'जनावरे जनगणना',
    clusterMeanRiskLabel: 'क्लस्टर सरासरी जोखीम',
    priorityFlaggedHeadsLabel: 'प्राधान्य चिन्हांकित जनावरे',
    barnClimateLabel: 'गोठा हवामान (SHT31-D)',
    tempLabel: 'तापमान',
    rhLabel: 'आर्द्रता',
    viewClusterAnimals: 'क्लस्टर जनावरे पहा',

    // Health Records page
    healthRecordsSubtitle: 'नैदानिक पशुवैद्यकीय निदान, थन तपासणी आणि उपचार',
    healthSearchPlaceholder: 'जनावर, स्थिती, औषध शोधा...',
    showingRecordsCount: 'नोंदी',
    physicalObservationsLabel: 'शारीरिक चिन्हे आणि निरीक्षण',
    prescribedInterventionLabel: 'निर्धारित हस्तक्षेप आणि प्रोटोकॉल',
    notesLabel: 'नोंदी',
    scheduledFollowUpLabel: 'नियोजित फॉलो-अप',
    healthEmptyHint: '"पशुवैद्यकीय उपचार नोंदवा" वर क्लिक करा.',

    // Live Monitoring page
    monitoringSubtitleLive: 'बॅकएंडकडून नवीनतम सेन्सर रीडिंग — रीफ्रेश अंतराल: 30 सेकंद',
    monitoringSubtitleDemo: 'MPU6050, DS18B20, MAX9814 कॉलर नोड आणि SHT31-D गोठा युनिटकडून स्ट्रीमिंग',
    stopAutoRefresh: 'ऑटो-रीफ्रेश थांबवा',
    startAutoRefresh: 'ऑटो-रीफ्रेश (30 सेकंद)',
    pauseTelemetry: 'टेलीमेट्री थांबवा',
    resumeStream: 'स्ट्रीम सुरू करा',
    tickLabel: 'टिक',
    updatedAtLabel: 'अद्यतनित',
    filterAnimalLabel: 'जनावर फिल्टर',
    allLivestockOption: 'सर्व लाइव्ह जनावरे',
    legendMeasured: 'मोजलेले (भौतिक सेन्सर)',
    legendAiInferred: 'एआय-अनुमानित (ध्वनिक)',
    legendEstimated: 'अंदाजित (THI निर्देशांक)',
    noAnimalsForFarm: 'या फार्मसाठी कोणतेही जनावर सापडले नाही.',
    baselineLabel: 'आधाररेखा',
    sensorsStable: 'सेन्सर स्थिर',
    historicalGraphsLink: 'ऐतिहासिक आलेख →',
    backendConnectedBadge: 'बॅकएंड जोडलेले',
    bleMeshBadge: 'ESP32 / BLE मेश',
    activityRawLabel: 'हालचाल (कच्चा)',
    awaitingData: 'डेटाची प्रतीक्षा',
    sourceLabel: 'स्रोत',

    // Milk Data page
    milkDataSubtitle: 'दूध उत्पादन, तापमान, EC, pH आणि प्रयोगशाळा SCC',
    submitsToBackend: 'बॅकएंडवर सबमिट',
    milkDemoNotice: 'नोंदी स्थानिक पातळीवर साठवल्या जातात. लाइव्ह मोडमध्ये बॅकएंडवर सबमिट होतात.',
    milkSearchPlaceholder: 'जनावर टॅग, तारीख, नोंदी शोधा…',
    inlineEcPhMode: 'इनलाइन EC/pH मोड',
    tableAnimal: 'जनावर',
    tableDate: 'तारीख',
    tableYield: 'उत्पादन (L)',
    tableMilkTemp: 'दूध तापमान',
    tableEc: 'EC (mS/cm)',
    tablePh: 'pH',
    tableScc: 'SCC (×10³)',
    tableNotes: 'नोंदी',
    tableActions: 'कृती',
    milkEmptyHint: '"दूध नोंद करा" वर क्लिक करा.',

    // Profile page
    defaultUserName: 'GoDrishti वापरकर्ता',
    architectureLabel: 'आर्किटेक्चर',
    dairyEnterpriseLabel: 'डेअरी उद्योग आणि पायाभूत सुविधा',
    facilityNameLabel: 'सुविधेचे नाव',
    locationLabel: 'स्थान',
    herdCapacityLabel: 'दुग्ध जनावरे क्षमता',
    supervisingVetLabel: 'देखरेख पशुवैद्य',
    emergencyClinicLabel: 'आपत्कालीन पशु दवाखाना',
    systemIntelligenceLabel: 'प्रणाली बुद्धिमत्ता आणि मॉडेल प्रमाणन',
    platformArchLabel: 'प्लॅटफॉर्म आर्किटेक्चर',
    modelPipelineLabel: 'मॉडेल पाइपलाइन',
    clinicalScopeLabel: 'लक्ष्य नैदानिक क्षेत्र',
    scientificValidationLabel: 'वैज्ञानिक सत्यापन',
    peerReviewedCompliant: 'सहकर्मी-समीक्षित अनुपालन',
    hardwareVerificationLabel: 'बहुविध हार्डवेअर आणि जैविक मॉडेल सत्यापन',
    acousticRuminationLabel: 'ध्वनिक रवंथ',
    skinTemperatureLabel: 'त्वचा तापमान',
    affordableFieldScreeningLabel: 'परवडणारी क्षेत्र स्क्रीनिंग',

    // Reports page
    reportsSubtitle: 'मासिक बोवाइन स्तनदाह लवकर स्क्रीनिंग सारांश आणि आर्थिक प्रभाव लेखापरीक्षण',
    printReportBtn: 'अहवाल मुद्रित करा',
    exportSummaryBtn: 'सारांश निर्यात करा',
    reportDocTitle: 'डेअरी जनावरे स्तनदाह लवकर पूर्वसूचना सर्वसमावेशक अहवाल',
    reportPeriodLabel: 'लक्ष्य कालावधी: सध्याचे दुग्धावस्था चक्र • निर्मित',
    totalScreenedHerd: 'एकूण तपासलेली जनावरे',
    headsUnit: 'जनावरे',
    highMastitisRisk: 'उच्च स्तनदाह जोखीम',
    moderateRiskWatch: 'मध्यम जोखीम निरीक्षण',
    biomarkerTrendDeviations: 'बायोमार्कर ट्रेंड विचलन',
    estMilkLossSaved: 'अंदाजे दूध हानी वाचवली',
    via7to14Detection: '7–14 दिवस लवकर शोधाद्वारे',
    highPriorityTableTitle: 'बहुविध इंजिनद्वारे चिन्हांकित उच्च प्राधान्य जनावरे',
    tableTag: 'टॅग',
    tableName: 'नाव',
    tableSpecies: 'प्रजाती',
    tableRiskScore: 'जोखीम गुण',
    tableDeviationFactors: 'प्राथमिक विचलन घटक',
    tablePrescribedAction: 'निर्धारित कृती',
    action4QuarterCmt: '4-पॅडल सीएमटी करा',
    actionObserveRumination: 'रवंथ निरीक्षण करा',
    vetRecommendationsTitle: 'फार्म पर्यवेक्षकासाठी पशुवैद्यकीय शिफारसी',
    reportRecommendation1: 'संध्याकाळच्या दुहाईदरम्यान प्राधान्य जनावरे वेगळी ठेवा.',
    reportRecommendation2: 'अचानक ध्वनिक घट दाखवणाऱ्या जनावरांचे कॉलर फिटमेंट तपासा.',
    reportRecommendation3: 'उच्च THI काळात सर्व दुग्ध जनावरांवर दुहाईनंतर अँटीसेप्टिक डिप लावा.',
    reportFootnote: '* GoDrishti एआय इंजिनद्वारे निर्मित • CMT प्रोटोकॉलनुसार सत्यापित',
    reportFootnoteRight: 'जनावरे आरोग्य बुद्धिमत्ता प्रणाली',

    // Settings page
    settingsSubtitle: 'फार्म आर्किटेक्चर, सेन्सर कॅलिब्रेशन, भाषा प्राधान्ये आणि फार्म व्यवस्थापन',
    farmArchitectureTitle: 'फार्म ऑपरेटिंग आर्किटेक्चर',
    farmArchitectureDesc: 'डेअरी स्वयंचलित पार्लर सेन्सर किंवा किफायतशीर उपकरणे वापरते हे निवडा',
    activeModeLabel: 'सक्रिय',
    lowResourceModeDesc: 'कॉलर ध्वनिक इन्फरन्सिंग, भौतिक थन निरीक्षण आणि 4-पॅडल सीएमटी. EC/pH लॅब SCC नाही.',
    recommendedRuralLabel: 'ग्रामीण क्लस्टरसाठी शिफारस',
    connectedModeDesc: 'पूर्ण स्टॅक IoT + स्वयंचलित मिल्किंग पार्लर. इनलाइन EC, pH आणि SCC समक्रमण.',
    recommendedCommercialLabel: 'व्यावसायिक फार्म आणि संशोधन जनावरांसाठी',
    uiLanguageTitle: 'यूजर इंटरफेस भाषा',
    langEnglish: 'इंग्रजी',
    langHindi: 'हिंदी',
    langMarathi: 'मराठी',
    calibrationThresholdsTitle: 'बायोमार्कर कॅलिब्रेशन थ्रेशोल्ड',
    calibrationThresholdsDesc: 'स्तनदाह लवकर जोखीम संवेदनशीलता ऑफसेट समायोजित करा',
    savedLabel: 'जतन केले',
    tempDeviationLimitLabel: 'त्वचा तापमान विचलन मर्यादा (°C)',
    alertIfDeltaHint: 'Δ > या मूल्यावर अलर्ट',
    ruminationDropLabel: 'रवंथ ध्वनिक ड्रॉप (%)',
    ruminationDropHint: '7-दिवस सरासरीपेक्षा कमी',
    thiThresholdLabel: 'THI उष्णता ताण उंबरठा',
    thiThresholdHint: 'मानक बोवाइन ताण: ≥ 79',
    cowBaselineTempLabel: 'देशी गाय आधारभूत तापमान (°C)',
    ds18b20CalibrationHint: 'DS18B20 त्वचा कॅलिब्रेशन',
    buffaloBaselineTempLabel: 'म्हीस आधारभूत तापमान (°C)',
    resetToDefaultsBtn: 'डीफॉल्टवर रीसेट करा',
    saveCalibrationBtn: 'कॅलिब्रेशन जतन करा',
    farmManagementTitle: 'फार्म व्यवस्थापन',
    farmManagementDesc: 'फार्म तयार करा आणि निवडा',
    newFarmBtn: 'नवीन फार्म',
    registerNewFarmTitle: 'नवीन फार्म नोंदवा',
    farmNameLabel: 'फार्मचे नाव *',
    farmNamePlaceholder: 'उदा. वैष्णवी डेअरी',
    farmCodeLabel: 'फार्म कोड *',
    farmCodePlaceholder: 'उदा. F01',
    locationOptionalLabel: 'स्थान (पर्यायी)',
    locationPlaceholder: 'उदा. आनंद, गुजरात, भारत',
    createFarmBtn: 'फार्म तयार करा',
    loadingFarmsLabel: 'बॅकएंडकडून फार्म लोड होत आहेत…',
    noFarmsRegistered: 'अद्याप कोणताही फार्म नोंदवला नाही. वरून एक तयार करा.',
    availableFarmsLabel: 'उपलब्ध फार्म',
    activeBadge: 'सक्रिय',
    setActiveBtn: 'सक्रिय करा',
    activeFarmIdLabel: 'सक्रिय फार्म ID',
    resetDemoDataTitle: 'डेमो डेटा रीसेट करा',
    resetDemoDataDesc: 'प्रारंभिक जनावरे, सेन्सर आणि मॉक नोंदी डीफॉल्टवर पुनर्संचयित करतो.',
    resetAllDataBtn: 'सर्व डेटा रीसेट करा',

    // Udder Analysis page
    supportiveVisionBadge: 'सहाय्यक दृष्टी मॉड्यूल',
    backendUploadBadge: 'बॅकएंड अपलोड',
    udderAnalysisSubtitle: 'कासे प्रतिमा मूल्यमापनात सहाय्य',
    animalLabel: 'जनावर',
    udderStep1Title: 'पायरी 1: मागील कासे प्रतिमा कॅप्चर किंवा अपलोड करा',
    changePhotoBtn: 'फोटो बदला',
    selectPhotoBtn: 'फोटो निवडा किंवा कॅमेरा उघडा',
    photoFormatHint: 'JPG, PNG, WEBP · मोबाइलवर थेट कॅमेरा',
    demoSampleLabel: 'किंवा डेमो नमुना निवडा',
    uploadingToBackend: 'बॅकएंडवर अपलोड होत आहे…',
    runningCvModel: 'CV मॉडेल चालू आहे…',
    uploadUdderImageBtn: 'कासे प्रतिमा अपलोड करा',
    analyzeUdderImageBtn: 'कासे प्रतिमा विश्लेषण करा',
    selectFileHint: 'तुमच्या डिव्हाइसमधून फाइल निवडा.',
    udderStep2Title: 'पायरी 2: मूल्यमापन निकाल',
    imageUploadedMsg: 'प्रतिमा बॅकएंडवर अपलोड झाली',
    storedAtLabel: 'साठवले',
    supportiveVisualAssessment: 'सहाय्यक दृश्य मूल्यमापन',
    cvModelLabel: 'मॉडेल',
    capturedLabel: 'कॅप्चर',
    requiresFollowUp: 'फॉलो-अप आवश्यक: CMT आणि पशुवैद्यकीय तपासणीशी सत्यापित करा.',
    viewAnimalProfileLink: 'जनावर प्रोफाइल पहा',
    newScanBtn: 'नवीन स्कॅन',
    morphologicalRiskLabel: 'रूपात्मक जोखीम पातळी',
    confidenceLabel: 'विश्वासार्हता',
    cvObservationsLabel: 'CV निरीक्षण',
    recommendedProtocolLabel: 'शिफारस केलेला प्रोटोकॉल',
    attachToProfileLink: 'जनावर प्रोफाइलशी जोडा',
    noScanYet: 'अद्याप कोणताही स्कॅन नाही.',
    noScanHint: 'प्रतिमा निवडा आणि "विश्लेषण" वर टॅप करा.',

    // Sidebar / Header / MoreDrawer
    activeModeShort: 'सक्रिय मोड',
    lowResourceModeShort: 'कॉलर + फोन + सीएमटी',
    connectedModeShort: 'बहु-सेन्सर + लॅब SCC',
    livestockHealthGuard: 'जनावरे आरोग्य रक्षक',
    sidebarFooterDisclaimer: 'एआय लवकर स्क्रीनिंग • पशुवैद्यांचा पर्याय नाही.',
    selectFarmArchitecture: 'फार्म आर्किटेक्चर निवडा',
    farmArchitectureAdaptDesc: 'उपलब्ध उपकरणांनुसार वैशिष्ट्ये जुळवते',
    lowResourceModeShortDesc: 'कॉलर, फोन निरीक्षण आणि CMT पॅडल. लॅब/SCC आवश्यक नाही.',
    connectedModeShortDesc: 'स्वयंचलित पार्लर, EC/pH सेन्सर आणि SCC एकत्रीकरण.',
    moreDrawerSubtitle: 'सर्व डेअरी बुद्धिमत्ता मॉड्यूल एक्सप्लोर करा',
    modeLabel: 'मोड',
    descLiveMonitoring: 'MPU6050, DS18B20, MAX9814 सेन्सर फीड',
    descAnalytics: 'हालचाल, रवंथ, THI, जोखीम ट्रेंड',
    descAddData: 'मॅन्युअल नोंदी आणि क्षेत्र फॉर्म',
    descMilkData: 'उत्पादन, EC, pH आणि SCC इतिहास',
    descCmtTests: '4-पॅडल स्कोरिंग आणि निकाल',
    descHealthRecords: 'पशुवैद्यकीय उपचार आणि फॉलो-अप',
    descUdderAnalysis: 'बहुविध दृश्य असममिती स्कॅन',
    descDevices: 'स्मार्ट कॉलर, परिवेश नोड आणि बॅटरी',
    descReports: 'गोठा आरोग्य सारांश आणि CSV',
    descFarmMap: 'GIS क्लस्टर जोखीम आणि फार्म स्थाने',
    descSettings: 'थ्रेशोल्ड, प्रजाती आधाररेखा आणि सेन्सर',
    descProfile: 'डेअरी ऑपरेटर आणि पशुवैद्यकीय प्रमाण-पत्रे',

    // ScientificDisclaimer
    clinicalProtocolsBadge: 'नैदानिक प्रोटोकॉल',
    sectionRumination: 'रवंथ',
    sectionSurfaceTemp: 'पृष्ठभाग तापमान',
    sectionUdderScan: 'कास स्कॅन',
    sectionSccData: 'SCC डेटा',
    sectionScope: '7–14 दिवस क्षेत्र',
    sectionDecisionSupport: 'निर्णय सहाय्य',

    // AI Health Signals extra
    computedLabel: 'गणना',
    scoreLabel: 'गुण',
    behaviorPendingDesc: 'मॉडेल 3 वर्तन एंडपॉइंट अद्याप जोडलेले नाही. हालचाल आणि रवंथ विचलन संकेत येथे दिसतील.',
    observationWindowLabel: 'निरीक्षण विंडो',

    // Dashboard extra
    openAlertsLabel: 'उघडे अलर्ट',
    avgHerdYield: 'सरासरी गोठा उत्पादन',
    moderateRiskAnimals: 'मध्यम धोका',
    runCmt: 'सीएमटी चालवा',
    scanUdder: 'कास स्कॅन',
    aiContributingFactors: 'एआय योगदान घटक',
    fromBackendSorted: 'बॅकएंडकडून — निर्मिती तारखेनुसार',
    rankedByRisk: 'बहुविध जोखीम स्कोरनुसार श्रेणीबद्ध',
    lowResourceSmallholder: 'किफायतशीर फार्म मोड',
    connectedMultiSensor: 'कनेक्टेड मल्टी-सेन्सर',
    totalLabel: 'एकूण',
    retryBtn: 'पुन्हा प्रयत्न',

    // Animals page
    profileAndRisk: 'प्रोफाइल आणि जोखीम',
    profileAndLiveData: 'प्रोफाइल आणि थेट डेटा',
    ageLabel: 'वय',
    lactationLabel: 'दुग्धावस्था',
    statusLabel: 'स्थिती',
    mastitisHxLabel: 'स्तनदाह इतिहास',
    collarLabel: 'कॉलर',
    riskDriversLabel: 'जोखीम कारणे',
    showingAnimals: 'दाखवत आहे',
    ofLabel: 'पैकी',
    allRiskLevels: 'सर्व जोखीम पातळ्या',
    allSpeciesCowsOnly: '🐄 फक्त गाई',
    allSpeciesBuffaloOnly: '🐃 फक्त म्हशी',
    herdRegistryDesc: 'डेअरी गाय आणि म्हीस जनावरे आरोग्य नोंदणी',
    liveBackendDesc: 'थेट बॅकएंड डेटा',
    searchTagBreedPlaceholder: 'टॅग ID, जात शोधा…',
    refreshLabel: 'रीफ्रेश',
    viewLabel: 'पहा',
    breedNotSpecified: 'जात निर्दिष्ट नाही',
    tagIdLabel: 'टॅग ID',

    // AnimalDetails
    recordCmtBtn: 'सीएमटी नोंदवा',
    logMilkBtn: 'दूध नोंदवा',
    udderScanBtn: 'कास स्कॅन',
    confirmatoryProtocol: 'पुष्टी मूल्यमापन प्रोटोकॉल',
    cmtPaddleCheck: 'पुढील दुहाईत सीएमटी पॅडल तपासणी करा.',
    checkRearQuarters: 'मागील कासांमध्ये स्थानिक उष्णता किंवा कठीणपणा तपासा.',
    antisepticDip: 'दुहाईनंतर अँटीसेप्टिक डिप लावा.',
    baselineSkinTempLabel: 'आधारभूत त्वचा तापमान',
    baselineRuminationLabel: 'आधारभूत रवंथ',
    baselineActivityLabel: 'आधारभूत हालचाल',
    avgDailyMilkLabel: 'सरासरी दैनिक दूध',
    liveIotSensors: 'थेट IoT कॉलर सेन्सर',
    milkingRecordsTitle: 'दूध नोंदी आणि दूध गुणवत्ता',
    cmtHistoryTitle: 'सीएमटी 4-पॅडल इतिहास',
    vetNotesTitle: 'पशुवैद्यकीय नोंदी आणि उपचार',
    logTreatmentBtn: 'उपचार नोंदवा',
    observationLabel: 'निरीक्षण',
    treatmentLabel: 'उपचार',
    vetLabel: 'डॉक्टर',
    followUpLabel: 'फॉलो-अप',
    computeRiskBtn: 'जोखीम मोजा',
    forecastLabel: 'पूर्वसूचना',
    riskScoreHistoryTitle: 'जोखीम स्कोर इतिहास (बॅकएंड)',
    screeningEventTimeline: 'स्क्रीनिंग आणि घटना कालरेषा',
    earlyRiskScoreLabel: 'प्राथमिक जोखीम स्कोर',
    collarAttachedLabel: 'स्मार्ट कॉलर जोडले',
    liveTelemetryBadge: 'थेट टेलीमेट्री',
    barnThi: 'गोठा THI',
    ambientTemp: 'बाहेरचे तापमान',
    humidityLabel: 'आर्द्रता',
    dimLabel: 'दुग्धावस्था दिवस',
    unknown: 'अज्ञात',
    notPaired: 'जोडलेले नाही',
    yesLabel: 'होय',
    noLabel: 'नाही',

    // Analytics extra
    surfaceTempLabel: 'पृष्ठभाग तापमान (°C)',
    aiRuminationLabel: 'रवंथ (मिनिट)',
    activityRawShort: 'हालचाल निर्देशांक',
    rangeAffectsFetch: '(रेंज सेन्सर डेटा मर्यादा प्रभावित करते)',
    loadingBackendSensor: 'बॅकएंड सेन्सर डेटा लोड होत आहे…',

    // Alerts extra
    reviewBtn: 'तपासा',
    demoDataBadge: 'डेमो डेटा',
    noFarmAlertData: 'कोणताही फार्म जोडलेला नाही. अलर्ट डेटासाठी फार्म नियुक्त करा.',
    foundLabel: 'अलर्ट सापडले',
    severityLabel: 'तीव्रता',

    // AddData page
    addDataSubtitle: 'शेतकरी, डेअरी पर्यवेक्षक आणि पॅरा-पशुवैद्यांसाठी केंद्रीय क्षेत्र डेटा नोंदणी',
    registerLivestockTitle: 'जनावर नोंदवा',
    registerLivestockDesc: 'नवीन गाय किंवा म्हीस आरोग्य प्रणालीत नोंदवा आणि आधाररेखा कॅलिब्रेट करा.',
    registerLivestockBadge: 'RFID / टॅग',
    milkingRecordQualityTitle: 'दूध नोंद आणि गुणवत्ता',
    milkingRecordQualityDesc: 'सकाळ/संध्याकाळ दूध उत्पादन, तापमान, EC, pH आणि SCC नोंदवा.',
    milkingRecordBadge: 'दैनिक उत्पादन',
    cmtTestTitle: 'कॅलिफोर्निया मास्टायटिस चाचणी (सीएमटी)',
    cmtTestDesc: '4-पॅडल चाचणी रीडिंग (LF, RF, LR, RR) सोमॅटिक सेल जेलेशनसाठी.',
    cmtTestBadge: 'मानक क्षेत्र चाचणी',
    vetLogTitle: 'पशुवैद्यकीय उपचार नोंद',
    vetLogDesc: 'शारीरिक चिन्हे, थन तपासणी, पशुवैद्यकीय निदान आणि उपचार नोंदवा.',
    vetLogBadge: 'नैदानिक इतिहास',
    udderAsymmetryTitle: 'कास असममिती दृश्य विश्लेषण',
    udderAsymmetryDesc: 'मागील कासांचा फोटो घ्या किंवा अपलोड करा आणि सूज, लालसरपणा आणि असममिती तपासा.',
    aiVisionBadge: 'एआय व्हिजन स्कॅन',
    launchCameraBtn: 'कॅमेरा आणि व्हिजन मॉड्यूल उघडा',
    openFormBtn: 'फॉर्म उघडा',
    bestFieldPracticesTitle: 'सर्वोत्तम क्षेत्र प्रथा: अल्प-खर्चिक स्तनदाह प्रोटोकॉल',
    stripCupTitle: '1. स्ट्रिप कप तपासणी',
    stripCupDesc: 'दुहाईपूर्वी 2-3 थेंब काळ्या कपात घाला. पाणीसारखी सुसंगतता, गुठळ्या किंवा फ्लेक्स पहा.',
    cmtPaddleStepTitle: '2. 4-पॅडल सीएमटी',
    cmtPaddleStepDesc: 'दूध आणि अभिकर्मक समान भाग (2 mL) मिसळा. 20 सेकंद हलवा. जेल तयार होणे उच्च सोमॅटिक सेल दर्शवते.',
    postMilkingDipTitle: '3. दुहाईनंतर टीट बॅरियर डिप',
    postMilkingDipDesc: '0.5% आयोडोफोर किंवा हर्बल अँटीसेप्टिकने दुहाईनंतर लगेच डिप करा. 30 मिनिटे उभे ठेवा.',

    // MilkData page
    showingRecords: 'दाखवत आहे',
    deleteMilkConfirm: 'ही दूध नोंद हटवायची?',
    milkDeletedToast: 'दूध नोंद हटवली',
    noMilkFoundTitle: 'कोणतीही दूध नोंद सापडली नाही.',
    clickToRecordMilk: '"दूध नोंद करा" वर क्लिक करा.',
    lowResourceModeTag: 'किफायतशीर मोड',

    // CMT page
    showingLabel: 'दाखवत आहे',
    deleteCmtConfirm: 'ही सीएमटी नोंद हटवायची?',
    cmtDeletedToast: 'सीएमटी नोंद हटवली',
    noCmtFoundTitle: 'कोणतीही सीएमटी नोंद सापडली नाही.',

    // HealthRecords page
    deleteHealthConfirm: 'ही आरोग्य आणि पशुवैद्यकीय नोंद हटवायची?',
    healthDeletedToast: 'नोंद हटवली',
    noHealthFoundTitle: 'कोणतीही आरोग्य नोंद सापडली नाही.',
    clickLogVet: '"पशुवैद्यकीय उपचार नोंदवा" वर क्लिक करा.',
    subjectLabel2: 'विषय',

    // LiveMonitoring extra
    noSensorDataAnimal: 'या जनावरासाठी अद्याप सेन्सर डेटा मिळाला नाही.',

    // UdderAnalysis extra
    sciConstraintTitle: 'वैज्ञानिक प्रतिबंध आणि अस्वीकरण',
    sciConstraintDesc: 'हे दृश्य मूल्यमापन केवळ सहाय्यक आहे — स्वतंत्र पशुवैद्यकीय निदान नाही. कासेची आकृती जात, दुग्धावस्था आणि दुहाईनुसार भिन्न असते. नेहमी सीएमटी किंवा एससीसीशी सत्यापित करा.',
    liveInfoDesc: 'थेट मोडमध्ये प्रतिमा बॅकएंडवर अपलोड होतात. CV विश्लेषण सध्या स्टब आहे. प्रीसेट URL अपलोड करता येत नाहीत.',
    cvAnalysisPendingDesc: 'CV पाइपलाइन सध्या स्टब आहे. मॉडेल जोडल्यावर निकाल दिसतील.',
    possibleSwelling: 'संभाव्य सूज',
    possibleRedness: 'संभाव्य लालसरपणा',
    visibleAsymmetry: 'दृश्य असममिती',
    cvConfidence: 'CV विश्वासार्हता',
    cvLesions: 'जखमा',
    cvDischarge: 'स्राव',
    statusProcessed: 'प्रक्रिया केली (डेमो)',
    requiresFollowUpTitle: 'फॉलो-अप आवश्यक',
    pleaseUploadPhoto: 'कृपया आधी कासेचा फोटो अपलोड किंवा निवडा',
    pleaseSelectAnimal: 'कृपया आधी जनावर निवडा',

    // Devices extra
    onlineOutOf: 'ऑनलाइन',
    signalConnected: '-68 dBm',
    signalWeak: 'कमकुवत',

    // FarmMap extra
    coopHubsMapped: '4 सहकारी हब मॅप केले',
    farmMapGeographicDesc: 'भौगोलिक जनावरे जोखीम दृश्य, THI आणि शेड क्लस्टर',
    headsLabel: 'जनावरे',

    // Reports extra
    requireCmtConfirmation: 'सीएमटी पुष्टी आवश्यक',
    cowsLabel: 'गाई',
    buffaloesPluralLabel: 'म्हशी',
    generatedOn: 'निर्मित',
    auditId: 'ऑडिट ID',
    farmClusterName: 'आनंद डेअरी सहकारी क्लस्टर',
    farmClusterLocation: 'गुजरात, भारत • सुपरवाइज्ड फील्ड पायलट',

    // Settings extra
    activeColonLabel: 'सक्रिय:',
    uniqueShortId: 'अद्वितीय लहान ID',
    connectedToApi: 'शी जोडलेले',
    calibrationSavedToast: 'कॅलिब्रेशन थ्रेशोल्ड डिव्हाइसवर जतन केले',
    calibrationResetToast: 'थ्रेशोल्ड डीफॉल्टवर रीसेट केले',
    demoDataResetToast: 'डेमो डेटा डीफॉल्ट स्थितीत पुनर्संचयित',
    farmCreatedToast: 'फार्म तयार झाला',
    activeFarmUpdatedToast: 'सक्रिय फार्म अद्यतनित झाला',
    languageSetToast: 'भाषा सेट केली',
    resetDemoConfirm: 'सर्व डेटा मूळ डेमो स्थितीत रीसेट करायचा? सर्व नव्याने तयार केलेल्या नोंदी हरवतील.',
    farmNameCodeRequired: 'फार्मचे नाव आणि कोड आवश्यक आहेत.',
    failedCreateFarm: 'फार्म तयार करण्यात अयशस्वी',
    farmCreatedMsg: 'फार्म तयार झाला',

    // Profile extra
    lowResourceModeValue: 'किफायतशीर फार्म मोड',
    connectedModeValue: 'कनेक्टेड मोड',
    goDrishtiUser: 'GoDrishti वापरकर्ता',
    profileSubtitle: 'GoDrishti डेअरी जनावरे आरोग्य प्रणाली',

    // Modal form labels
    selectAnimalModalLabel: 'जनावर निवडा *',
    backendLabel2: 'बॅकएंड',
    loadingAnimalsLabel: 'जनावरे लोड होत आहेत…',
    noBackendAnimalsMsg: 'बॅकएंडवर कोणतेही जनावर सापडले नाही. फार्म नियुक्ती तपासा.',
    dataSourceLabel: 'डेटा स्रोत',
    farmerObservation: 'शेतकरी निरीक्षण',
    fieldKitPaddle: 'क्षेत्र किट / पॅडल',
    labSubmission: 'लॅब सबमिशन',
    veterinaryClinic: 'पशुवैद्यकीय दवाखाना',
    milkingDateLabel: 'दुहाई तारीख',
    milkYieldLabel: 'दूध उत्पादन (लिटर) *',
    milkTempCLabel: 'दूध तापमान (°C)',
    electricalCondLabel: 'विद्युत वाहकता (mS/cm)',
    electricalCondHint: 'निरोगी: 5.0 – 5.5',
    milkPhLabel: 'दूध pH',
    milkPhHint: 'निरोगी: 6.6 – 6.8',
    sccCellsLabel: 'SCC (×10³ cells/mL)',
    sccNotMeasured: 'कॉलरद्वारे मोजले जात नाही — लॅब/रॅपिड टेस्ट निकाल नोंदवा.',
    visualObsLabel: 'दृश्य निरीक्षण / नोंदी',
    saveMilkDataBtn: 'दूध डेटा जतन करा',
    testDateLabel: 'चाचणी तारीख',
    cmtPaddleReadingsLabel: 'सीएमटी 4-पॅडल रीडिंग',
    testerNameLabel: 'चाचणीकर्त्याचे नाव / भूमिका',
    fieldNotesLabel: 'क्षेत्र नोंदी',
    saveCmtRecordBtn: 'सीएमटी नोंद जतन करा',
    physicalObservationLabel: 'शारीरिक निरीक्षण *',
    suspectedConditionLabel: 'संशयास्पद स्थिती',
    treatmentInterventionLabel: 'उपचार / हस्तक्षेप',
    vetNotesModalLabel: 'पशुवैद्यकीय नोंदी',
    vetParavetLabel: 'पशुवैद्य / पॅरा-व्हेट',
    followUpDateLabel: 'फॉलो-अप तारीख',
    udderTempLabel: 'कास तापमान (°C)',
    saveHealthRecordBtn: 'आरोग्य नोंद जतन करा',
    registerNewLivestockTitle: 'नवीन जनावर नोंदवा',
    recordMilkQualityTitle: 'दूध आणि गुणवत्ता नोंदवा',
    cmtFourQuarterTitle: 'कॅलिफोर्निया मास्टायटिस चाचणी (सीएमटी) 4-पॅडल नोंद',
    vetObsTreatmentTitle: 'पशुवैद्यकीय निरीक्षण आणि उपचार नोंद',
    savesToBackendBadge: '🟢 बॅकएंडवर जतन होते',
    demoLocalBadge: '🟡 डेमो मोड (localStorage)',
    farmLinkedMsg: 'जनावर बॅकएंडमध्ये तयार होईल आणि या फार्मशी जोडले जाईल.',
    baselineNotice: 'DS18B20 त्वचा तापमान आणि MAX9814 रवंथ ध्वनी आधाररेखा मूल्ये पहिल्या ७ दिवसांत कॅलिब्रेट होतील.',
    registerAnimalBtn2: 'जनावर नोंदवा',
    healthyLabel: 'निरोगी',
    investigateLabel: 'तपासा',
    clearLabel: 'स्पष्ट',
    precipitateLabel: 'अवक्षेपण',
    gelLabel: 'जेल',

    // Toast messages
    toastAlertAcknowledged: 'अलर्ट मान्य केला',
    toastAlertResolved: 'अलर्ट निवारण झाले',
    toastFailedAcknowledge: 'अलर्ट मान्य करण्यात अयशस्वी',
    toastFailedResolve: 'अलर्ट निवारण करण्यात अयशस्वी',
    toastDashboardRefreshed: 'डॅशबोर्ड रीफ्रेश झाला',
    toastRiskComputed: 'जोखीम गणना झाली',
    toastFailedRisk: 'जोखीम गणना अयशस्वी',
    toastAnimalRegistered: 'जनावर नोंदवले!',
    toastFailedRegister: 'जनावर नोंदणी अयशस्वी',
    toastMilkSaved: 'दूध नोंद केली',
    toastFailedMilkSave: 'दूध डेटा जतन करण्यात अयशस्वी',
    toastCmtSaved: 'सीएमटी चाचणी जतन केली',
    toastFailedCmtSave: 'सीएमटी नोंद जतन करण्यात अयशस्वी',
    toastHealthSaved: 'आरोग्य नोंद केली',
    toastFailedHealthSave: 'आरोग्य नोंद जतन करण्यात अयशस्वी',
    toastSwitchedConnected: 'कनेक्टेड फार्म मोडवर बदलले (प्रगत लॅब आणि सेन्सर सक्षम)',
    toastSwitchedLowResource: 'किफायतशीर मोडवर बदलले (कॉलर, मोबाइल आणि सीएमटी केंद्रित)',
    toastDevicePingSuccess: 'डिव्हाइसने प्रतिसाद दिला! विलंब: 42ms (BLE Mesh)',
    toastDeviceStatus: 'डिव्हाइस स्थिती सेट केली',
    toastReportDownloaded: 'अहवाल PDF/CSV म्हणून डाउनलोड झाला',
    toastAnalyticsCsvLive: 'अ‍ॅनालिटिक्स CSV बॅकएंड डेटामधून निर्यात झाली',
    toastAnalyticsCsvDemo: 'अ‍ॅनालिटिक्स CSV निर्यात झाली (डेमो डेटा)',
    toastUdderUploaded: 'कास प्रतिमा बॅकएंडवर अपलोड झाली',
    toastUdderAssessed: 'सहाय्यक दृश्य मूल्यमापन पूर्ण',
  },
};
