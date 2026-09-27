// src/App.jsx - REFACTORED FOR NEW API PAYLOAD
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Container, Typography, Box, AppBar, Toolbar, Button,
  CssBaseline, ThemeProvider, createTheme, CircularProgress, Alert
} from '@mui/material';

import ScenarioPage from './pages/ScenarioPage.jsx';
import ModelSetupPage from './pages/ModelSetupPage.jsx';
import { AVAILABLE_MODES, calculateScenario } from './localCalculation.js';

const colors = {
  paper: '#f2ece0',
  paper2: '#e9e1d2',
  ink: '#1c1a17',
  ink2: '#463f38',
  ink3: '#5c5349',
  signal: '#c2410c',
  rule: '#c9a961',
  ruleDeep: '#ab8434',
  deep: '#2e4f57',
  keeps: '#0f5847',
  crimson: '#8e2f33',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: colors.signal, contrastText: colors.paper },
    secondary: { main: colors.deep, contrastText: colors.paper },
    error: { main: colors.crimson },
    success: { main: colors.keeps },
    background: { default: colors.paper, paper: colors.paper },
    text: { primary: colors.ink, secondary: colors.ink3 },
    divider: colors.rule,
  },
  typography: {
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    h1: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, letterSpacing: '-0.016em' },
    h2: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, letterSpacing: '-0.012em' },
    h3: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    h4: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    h5: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    h6: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
    button: { fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.12em' },
    caption: { fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.02em' },
  },
  shape: { borderRadius: 2 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.paper, color: colors.ink },
        '::selection': { backgroundColor: colors.rule, color: colors.ink },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${colors.rule}`,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 0, textTransform: 'uppercase' },
        outlined: { borderColor: colors.ruleDeep },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: colors.rule } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colors.paper,
          '& fieldset': { borderColor: colors.rule },
          '&:hover fieldset': { borderColor: colors.ruleDeep },
          '&.Mui-focused fieldset': { borderColor: colors.signal, borderWidth: 1 },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: colors.signal },
        rail: { backgroundColor: colors.rule, opacity: 0.55 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { backgroundColor: colors.paper2, borderColor: colors.rule },
      },
    },
  },
});

function NucBrandMark() {
  return (
    <Box className="nuc-brand-mark" role="img" aria-label="Nunes-Ueno Consulting">
      <span className="nuc-brand-mark__line"><i>N</i><i>U</i><i>N</i><i>E</i><i>S</i></span>
      <span className="nuc-brand-mark__line"><i>U</i><i>E</i><i>N</i><i>O</i></span>
      <span className="nuc-brand-mark__label"><i>C</i><i>O</i><i>N</i><i>S</i><i>U</i><i>L</i><i>T</i><i>I</i><i>N</i><i>G</i></span>
    </Box>
  );
}

const FALLBACK_START_YEAR = 2024;
const FALLBACK_NUM_YEARS = 5;
const FALLBACK_POPULATION = 10000;
const FALLBACK_PARKING_SUPPLY = 5000;
const DEFAULT_PARKING_COST = 5000;

function App() {
  const [modesLoading, setModesLoading] = useState(true);
  const [modesError, setModesError] = useState(null);
  const [availableModes, setAvailableModes] = useState([]);

  const [appConfig, setAppConfig] = useState({
    startYear: FALLBACK_START_YEAR,
    numYears: FALLBACK_NUM_YEARS,
    showRate: 100,
    defaultParkingCost: DEFAULT_PARKING_COST,
    quickStartPopulation: FALLBACK_POPULATION,
    quickAnnualGrowthRate: 0,
    quickStartParkingSupply: FALLBACK_PARKING_SUPPLY,
    includeShuttleCosts: true,
    shuttleBaselineCost: 12000000,
    shuttleParkingPercentage: 50,
    shuttleCostPerHour: 100,
    shuttlePeakHours: 3,
    shuttleVehicleCapacity: 30,
    shuttleMinContractHours: 4,
    shuttleOperatingDays: 280,
  });

  const [intermediateNumberInputs, setIntermediateNumberInputs] = useState({
    ...Object.fromEntries(Object.entries(appConfig).map(([key, value]) => [key, String(value)]))
  });

  const [activeModeSelection, setActiveModeSelection] = useState({});
  const [modeCustomizations, setModeCustomizations] = useState({});
  const [baselineModeShares, setBaselineModeShares] = useState({});

  const [inputState, setInputState] = useState({
    modeShares: {},
    populationValues: Array(appConfig.numYears).fill(appConfig.quickStartPopulation),
    parkingSupplyValues: Array(appConfig.numYears).fill(appConfig.quickStartParkingSupply),
    parkingCost: appConfig.defaultParkingCost,
  });

  const [baselineApiResponseData, setBaselineApiResponseData] = useState(null);
  const [apiResponseData, setApiResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [interactiveError, setInteractiveError] = useState(null);

  const activeModeDetails = useMemo(() => {
    if (!availableModes || availableModes.length === 0) return {};
    const details = {};
    Object.keys(activeModeSelection).forEach(key => {
      if (activeModeSelection[key]) {
        const baseMode = availableModes.find(m => m.key === key);
        if (baseMode) {
          const custom = modeCustomizations[key] || {};
          details[key] = {
            key: baseMode.key, name: custom.name || baseMode.defaultName, color: custom.color || baseMode.defaultColor,
            flags: baseMode.flags, parking_factor_per_person: baseMode.parking_factor_per_person,
          };
        }
      }
    });
    return details;
  }, [availableModes, activeModeSelection, modeCustomizations]);

  const actualYears = useMemo(() =>
    Array.from({ length: appConfig.numYears }, (_, i) => appConfig.startYear + i),
    [appConfig.startYear, appConfig.numYears]
  );

  const sortedActiveModeKeysForDisplay = useMemo(() => {
    const currentActiveDetails = activeModeDetails;
    const currentBaselineShares = baselineModeShares;
    if (!currentActiveDetails || Object.keys(currentActiveDetails).length === 0 || !currentBaselineShares || Object.keys(currentBaselineShares).length === 0) {
      return [];
    }
    const keysToSort = [...Object.keys(currentActiveDetails)];
    keysToSort.sort((keyA, keyB) => (currentBaselineShares[keyB] ?? 0) - (currentBaselineShares[keyA] ?? 0) || keyA.localeCompare(keyB));
    return keysToSort;
  }, [activeModeDetails, baselineModeShares]);

  const runCalculations = useCallback((currentInputState, currentAppConfig, currentBaselineShares, currentModeDetails) => {
    if (Object.keys(currentBaselineShares).length === 0 || !currentAppConfig) return;
    setInteractiveError(null);
    try {
        const { baselineResults, scenarioResults } = calculateScenario({
          inputState: currentInputState,
          appConfig: currentAppConfig,
          baselineModeShares: currentBaselineShares,
          activeModeDetails: currentModeDetails,
        });
        setBaselineApiResponseData(baselineResults);
        setApiResponseData(scenarioResults);
    } catch (err) {
        setInteractiveError(err.message || "An unknown error occurred.");
    }
    setIsLoading(false);
  }, []);


  useEffect(() => {
    const loadInitialModes = () => {
      setModesLoading(true); setModesError(null);
      try {
        const modesData = AVAILABLE_MODES;
        setAvailableModes(modesData);
        const iActiveSel = {}, iCustom = {}, iBaseShares = {};
        modesData.forEach(m => {
          iActiveSel[m.key] = m.isDefaultActive || false;
          iBaseShares[m.key] = m.isDefaultActive ? (m.defaultBaselineShare || 0) : 0;
          iCustom[m.key] = { name: m.defaultName, color: m.defaultColor };
        });
        setActiveModeSelection(iActiveSel);
        setModeCustomizations(iCustom);
        setBaselineModeShares(iBaseShares);
        setInputState(prev => ({ ...prev, modeShares: { ...iBaseShares } }));
        setModesLoading(false);
      } catch (err) {
          setModesError(err.message || "Failed to load modes.");
          setModesLoading(false);
      }
    };
    loadInitialModes();
  }, []);

  useEffect(() => {
    setIntermediateNumberInputs({
      ...Object.fromEntries(Object.entries(appConfig).map(([key, value]) => [key, String(value)]))
    });
  }, [appConfig]);

  // Effect to run calculations when core data is ready or changes
  useEffect(() => {
    if (!modesLoading && Object.keys(baselineModeShares).length > 0) {
      runCalculations(inputState, appConfig, baselineModeShares, activeModeDetails);
    }
  }, [modesLoading, inputState, appConfig, baselineModeShares, activeModeDetails, runCalculations]);

  // --- Handlers ---
  // Handler for custom number format component
  const handleBaselineFormattedNumberChange = useCallback((payload) => {
    const {name, value} = payload.target;
    setIntermediateNumberInputs(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBaselineNumberCommit = useCallback((event) => {
      const { name, value } = event.target;
      let numericValue = parseFloat(String(value).replace(/[$,]/g, ''));
      if (isNaN(numericValue)) {
        numericValue = appConfig[name] || 0;
      }
      setAppConfig(prevAppConfig => ({ ...prevAppConfig, [name]: numericValue }));
  }, [appConfig]);

  const handleBaselineCheckboxChange = useCallback((event) => {
    const { name, checked } = event.target;
    setAppConfig(prevAppConfig => ({ ...prevAppConfig, [name]: checked }));
  }, []);

  const handleModeShareChange = useCallback((modeKey, newShareRaw) => {
    const newShare = parseFloat(newShareRaw);
    if (isNaN(newShare) || newShare < 0 || newShare > 100) return;
    setInputState(prevState => {
        const currentShares = { ...prevState.modeShares };
        const activeKeys = Object.keys(activeModeSelection).filter(k => activeModeSelection[k]);
        if (!activeKeys.includes(modeKey)) return prevState;
        const otherActiveKeys = activeKeys.filter(k => k !== modeKey);
        const oldShareOfThisMode = currentShares[modeKey] || 0;
        let changeInThisMode = newShare - oldShareOfThisMode;
        const newShares = { ...currentShares };
        newShares[modeKey] = newShare;
        if (otherActiveKeys.length > 0) {
            let totalOtherSharesOriginal = 0;
            otherActiveKeys.forEach(k => { totalOtherSharesOriginal += (currentShares[k] || 0); });
            if (totalOtherSharesOriginal > 0) {
                otherActiveKeys.forEach(k => {
                    const reduction = (currentShares[k] / totalOtherSharesOriginal) * changeInThisMode;
                    newShares[k] = Math.max(0, currentShares[k] - reduction);
                });
            } else if (changeInThisMode < 0) {
                const shareToAdd = -changeInThisMode / otherActiveKeys.length;
                otherActiveKeys.forEach(k => { newShares[k] = (newShares[k] || 0) + shareToAdd; });
            }
        }
        let currentTotal = 0;
        activeKeys.forEach(k => currentTotal += (newShares[k] || 0));
        if (Math.abs(currentTotal - 100) > 0.001 && currentTotal > 0) {
            activeKeys.forEach(k => { newShares[k] = (newShares[k] / currentTotal) * 100; });
        }
        return { ...prevState, modeShares: newShares };
    });
  }, [activeModeSelection]);

  const handleModeNumericInputCommit = useCallback((modeKey, newNumericValue) => {
    handleModeShareChange(modeKey, newNumericValue);
  }, [handleModeShareChange]);

  const handleReset = useCallback(() => {
    let resetPopulationValues = Array(appConfig.numYears).fill(appConfig.quickStartPopulation);
    if (appConfig.quickAnnualGrowthRate !== 0) {
        for (let i = 1; i < appConfig.numYears; i++) {
            resetPopulationValues[i] = resetPopulationValues[i-1] * (1 + appConfig.quickAnnualGrowthRate / 100);
        }
    }
    const resetParkingValues = Array(appConfig.numYears).fill(appConfig.quickStartParkingSupply);
    setInputState({
      modeShares: { ...baselineModeShares },
      populationValues: resetPopulationValues,
      parkingSupplyValues: resetParkingValues,
      parkingCost: appConfig.defaultParkingCost,
    });
  }, [baselineModeShares, appConfig]);

  if (modesLoading) { return ( <ThemeProvider theme={theme}><CssBaseline /><Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /><Typography ml={2}>Loading Mode Configuration...</Typography></Box></ThemeProvider> ); }
  if (modesError) { return ( <ThemeProvider theme={theme}><CssBaseline /><Container maxWidth="sm" sx={{ mt: 5 }}><Alert severity="error">Error loading application: {modesError}. Please check API and refresh.</Alert></Container></ThemeProvider> ); }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="sticky" color="transparent" elevation={0} className="nuc-appbar">
          <Toolbar className="nuc-toolbar" disableGutters>
            <Box className="nuc-lockup">
              <NucBrandMark />
              <Box className="nuc-product-lockup">
                <Typography className="nuc-product-code">TDM.NU</Typography>
                <Typography className="nuc-product-name">Transportation demand model</Typography>
              </Box>
            </Box>
            <Box component="nav" className="nuc-nav" aria-label="Primary navigation">
              <Button component={NavLink} to="/" className={({ isActive }) => (isActive ? 'is-active' : '')}>Scenario</Button>
              <Button component={NavLink} to="/setup" className={({ isActive }) => (isActive ? 'is-active' : '')}>Model setup</Button>
            </Box>
          </Toolbar>
        </AppBar>
        <Container maxWidth="xl" component="main" className="nuc-main">
          <Box className="nuc-page-intro">
            <Typography className="nuc-eyebrow">TDM.NU / decision support</Typography>
            <Typography component="h1">Transportation demand model</Typography>
            <Typography className="nuc-lede">Test mode-share and parking choices against a clear operating baseline.</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={
                  <ScenarioPage
                    inputState={inputState} apiResponseData={apiResponseData} baselineApiResponseData={baselineApiResponseData}
                    activeModeDetails={activeModeDetails} actualYears={actualYears} sortedActiveModeKeys={sortedActiveModeKeysForDisplay}
                    isLoading={isLoading} interactiveError={interactiveError} baselineIsLoading={isLoading} baselineError={interactiveError} // Simplification: Use main loading/error for both for now
                    onModeShareChange={handleModeShareChange} onModeNumericInputCommit={handleModeNumericInputCommit} onReset={handleReset}
                  /> } />
              <Route path="/setup" element={
                  <ModelSetupPage
                    baselineConfig={appConfig}
                    intermediateNumberInputs={intermediateNumberInputs}
                    onBaselineNumberInputChange={handleBaselineFormattedNumberChange} // Use the new handler for formatted inputs
                    onBaselineNumberCommit={handleBaselineNumberCommit}
                    onBaselineCheckboxChange={handleBaselineCheckboxChange}
                  /> } />
            </Routes>
          </Box>
          <Box component="footer" className="nuc-footer">
            <Box className="nuc-footer__firm">
              <span className="nuc-footer__dot" aria-hidden="true" />
              <Typography component="span">Nunes–Ueno Consulting</Typography>
            </Box>
            <Typography component="span" className="nuc-footer__meta">tdm.nunes-ueno.com · © {new Date().getFullYear()}</Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
