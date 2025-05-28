// src/App.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Removed PropTypes import as it's not explicitly used in App.jsx itself after ModelSetupPage simplification
// import PropTypes from 'prop-types';
import axios from 'axios';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  Container, Typography, Box, AppBar, Toolbar, Button,
  CssBaseline, ThemeProvider, createTheme, CircularProgress, Alert, Link // Added Link for potential use in footer
} from '@mui/material';

import ScenarioPage from './pages/ScenarioPage.jsx';
import ModelSetupPage from './pages/ModelSetupPage.jsx';
import { API_BASE_URL, DEFAULT_PARKING_COST } from './config';

const theme = createTheme({
  palette: {
    primary: { main: '#1976D2' }, // Blue primary color
    secondary: { main: '#ffc107' },
    background: { 
      default: '#f5f5f5', // Light grey background for the page
      paper: '#ffffff' // White background for Paper components (like the footer)
    }
  },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
});

const FALLBACK_START_YEAR = 2024;
const FALLBACK_NUM_YEARS = 5;
const FALLBACK_POPULATION = 10000;
const FALLBACK_PARKING_SUPPLY = 5000;


function App() {
  // console.log("App Component: Mounting/Rendering");

  // --- State for Available Modes & Initial Setup ---
  const [modesLoading, setModesLoading] = useState(true);
  const [modesError, setModesError] = useState(null);
  const [availableModes, setAvailableModes] = useState([]);

  // --- State for App Configuration (Baseline edited on ModelSetupPage) ---
  const [appConfig, setAppConfig] = useState({
    startYear: FALLBACK_START_YEAR,
    numYears: FALLBACK_NUM_YEARS,
    showRate: 100,
    defaultParkingCost: DEFAULT_PARKING_COST,
    quickStartPopulation: FALLBACK_POPULATION,
    quickAnnualGrowthRate: 0,
    quickStartParkingSupply: FALLBACK_PARKING_SUPPLY,
  });

  const [intermediateNumberInputs, setIntermediateNumberInputs] = useState({
    startYear: String(appConfig.startYear),
    numYears: String(appConfig.numYears),
    showRate: String(appConfig.showRate),
    defaultParkingCost: String(appConfig.defaultParkingCost),
    quickStartPopulation: String(appConfig.quickStartPopulation),
    quickAnnualGrowthRate: String(appConfig.quickAnnualGrowthRate),
    quickStartParkingSupply: String(appConfig.quickStartParkingSupply),
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
  const [isBaselineLoading, setIsBaselineLoading] = useState(false);
  const [baselineError, setBaselineError] = useState(null);

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
    const activeKeysInput = Object.keys(currentActiveDetails);
    const keysToSort = [...activeKeysInput];
    const sortedResult = keysToSort.sort((keyA, keyB) => {
      const shareA = currentBaselineShares[keyA];
      const shareB = currentBaselineShares[keyB];
      const numShareA = (typeof shareA === 'number' && !isNaN(shareA)) ? shareA : 0;
      const numShareB = (typeof shareB === 'number' && !isNaN(shareB)) ? shareB : 0;
      if (numShareB === numShareA) return keyA.localeCompare(keyB);
      return numShareB - numShareA;
    });
    return sortedResult;
  }, [activeModeDetails, baselineModeShares]);

  useEffect(() => {
    const fetchInitialModes = async () => {
      setModesLoading(true); setModesError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/modes/available`);
        const modesData = response.data;
        setAvailableModes(modesData);
        const iActiveSel = {}, iCustom = {}, iBaseShares = {}; let sumDef = 0;
        modesData.forEach(m => {
          iActiveSel[m.key] = m.isDefaultActive || false;
          iBaseShares[m.key] = m.isDefaultActive ? (m.defaultBaselineShare || 0) : 0;
          if (m.isDefaultActive) sumDef += (m.defaultBaselineShare || 0);
          iCustom[m.key] = { name: m.defaultName, color: m.defaultColor };
        });
        if (sumDef > 0 && Math.abs(sumDef - 100) > 0.01) {
            const activeDefaultKeys = modesData.filter(m => m.isDefaultActive).map(m => m.key);
            activeDefaultKeys.forEach(key => {
                if (iBaseShares[key] !== undefined) iBaseShares[key] = (iBaseShares[key] / sumDef) * 100;
            });
        }
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
    fetchInitialModes();
  }, []);

  useEffect(() => {
    setIntermediateNumberInputs({
        startYear: String(appConfig.startYear),
        numYears: String(appConfig.numYears),
        showRate: String(appConfig.showRate),
        defaultParkingCost: String(appConfig.defaultParkingCost),
        quickStartPopulation: String(appConfig.quickStartPopulation),
        quickAnnualGrowthRate: String(appConfig.quickAnnualGrowthRate),
        quickStartParkingSupply: String(appConfig.quickStartParkingSupply),
    });
  }, [appConfig]);

  const fetchBaselineData = useCallback(async (currentAppConfig) => {
    if (Object.keys(baselineModeShares).length === 0 || Object.keys(activeModeDetails).length === 0 || !currentAppConfig) return;
    setIsBaselineLoading(true); setBaselineError(null);
    const currentActiveKeys = Object.keys(activeModeSelection).filter(key => activeModeSelection[key]);
    if (currentActiveKeys.length === 0) { setIsBaselineLoading(false); return; }
    const filteredShares = {}; currentActiveKeys.forEach(k => { filteredShares[k] = baselineModeShares[k] ?? 0; });
    let baselinePopulationValues = Array(currentAppConfig.numYears).fill(currentAppConfig.quickStartPopulation);
    if (currentAppConfig.quickAnnualGrowthRate !== 0) {
        for (let i = 1; i < currentAppConfig.numYears; i++) {
            baselinePopulationValues[i] = baselinePopulationValues[i-1] * (1 + currentAppConfig.quickAnnualGrowthRate / 100);
        }
    }
    const baselineParkingSupplyValues = Array(currentAppConfig.numYears).fill(currentAppConfig.quickStartParkingSupply);
    const payload = {
      activeModeKeys: currentActiveKeys, modeCustomizations,
      inputParameters: {
        modeShares: filteredShares,
        population_per_year: baselinePopulationValues.slice(0, currentAppConfig.numYears),
        parking_supply_per_year: baselineParkingSupplyValues.slice(0, currentAppConfig.numYears),
        parking_cost_per_space: currentAppConfig.defaultParkingCost, show_rate_percent: currentAppConfig.showRate,
        num_years: currentAppConfig.numYears,
      }
    };
    try {
      const response = await axios.post(`${API_BASE_URL}/calculate`, payload);
      setBaselineApiResponseData(response.data);
    } catch (err) {setBaselineError(err.response?.data?.error || err.message);}
    finally { setIsBaselineLoading(false); }
  }, [ activeModeDetails, activeModeSelection, baselineModeShares, modeCustomizations ]);

  const fetchData = useCallback(async (currentInputStateForFetch, currentAppConfig) => {
    if (Object.keys(currentInputStateForFetch.modeShares).length === 0 || Object.keys(activeModeDetails).length === 0 || !currentAppConfig) return;
    setIsLoading(true); setInteractiveError(null);
    const currentActiveKeys = Object.keys(activeModeSelection).filter(key => activeModeSelection[key]);
    if (currentActiveKeys.length === 0) { setIsLoading(false); return; }
    const filteredShares = {}; currentActiveKeys.forEach(k => {filteredShares[k] = currentInputStateForFetch.modeShares[k] ?? 0; });
    const payload = {
      activeModeKeys: currentActiveKeys, modeCustomizations,
      inputParameters: {
        modeShares: filteredShares,
        population_per_year: currentInputStateForFetch.populationValues.slice(0, currentAppConfig.numYears),
        parking_supply_per_year: currentInputStateForFetch.parkingSupplyValues.slice(0, currentAppConfig.numYears),
        parking_cost_per_space: currentInputStateForFetch.parkingCost, show_rate_percent: currentAppConfig.showRate,
        num_years: currentAppConfig.numYears,
      }
    };
    try {
      const response = await axios.post(`${API_BASE_URL}/calculate`, payload);
      setApiResponseData(response.data);
    } catch (err) { setInteractiveError(err.response?.data?.error || err.message); }
    finally { setIsLoading(false); }
  }, [ activeModeDetails, activeModeSelection, modeCustomizations ]);

  const stringifiedInitialModeShares = JSON.stringify(inputState.modeShares);
  useEffect(() => {
    if (!modesLoading && !modesError && availableModes.length > 0 &&
        Object.keys(baselineModeShares).length > 0 && Object.keys(inputState.modeShares).length > 0 &&
        !baselineApiResponseData ) {
      fetchBaselineData(appConfig);
      fetchData(inputState, appConfig);
    }
  }, [modesLoading, modesError, availableModes, baselineModeShares, stringifiedInitialModeShares,
      baselineApiResponseData, fetchBaselineData, fetchData, inputState, appConfig]);

  const stringifiedInputModeSharesForEffect = JSON.stringify(inputState.modeShares);
  const stringifiedInputPopulationValues = JSON.stringify(inputState.populationValues);
  const stringifiedInputParkingSupplyValues = JSON.stringify(inputState.parkingSupplyValues);
  const inputParkingCostForEffect = inputState.parkingCost;
  useEffect(() => {
    if (modesLoading || !baselineApiResponseData) return;
    fetchData(inputState, appConfig);
  }, [ stringifiedInputModeSharesForEffect, stringifiedInputPopulationValues, stringifiedInputParkingSupplyValues,
      inputParkingCostForEffect, fetchData, modesLoading, baselineApiResponseData, inputState, appConfig ]);

  const handleBaselineNumberInputChange = useCallback((event) => {
      const { name, value } = event.target;
      setIntermediateNumberInputs(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBaselineNumberCommit = useCallback((event) => {
      const { name, value } = event.target;
      let numericValue = parseFloat(value);
      if (name === "numYears" && (isNaN(numericValue) || numericValue <= 0 || numericValue > 50)) {
          setIntermediateNumberInputs(prev => ({ ...prev, [name]: String(appConfig[name] || FALLBACK_NUM_YEARS) }));
          return;
      }
      if (name === "startYear" && (isNaN(numericValue) || numericValue < 1900 || numericValue > 2200)) {
          setIntermediateNumberInputs(prev => ({ ...prev, [name]: String(appConfig[name] || FALLBACK_START_YEAR) }));
          return;
      }
      if (!isNaN(numericValue)) {
          setAppConfig(prevAppConfig => {
              const newConfig = { ...prevAppConfig, [name]: numericValue };
              let populationValuesUpdated = false;
              let parkingSupplyValuesUpdated = false;
              let newPopulationValues = [...inputState.populationValues];
              let newParkingSupplyValues = [...inputState.parkingSupplyValues];
              if (name === 'numYears' && numericValue !== prevAppConfig.numYears) {
                  const currentQuickStartPop = newConfig.quickStartPopulation;
                  const currentGrowthRate = newConfig.quickAnnualGrowthRate;
                  const currentQuickStartParking = newConfig.quickStartParkingSupply;
                  newPopulationValues = Array(numericValue).fill(currentQuickStartPop);
                  if (currentGrowthRate !== 0) {
                      for (let i = 1; i < numericValue; i++) {
                          newPopulationValues[i] = newPopulationValues[i-1] * (1 + currentGrowthRate / 100);
                      }
                  }
                  newParkingSupplyValues = Array(numericValue).fill(currentQuickStartParking);
                  populationValuesUpdated = true; parkingSupplyValuesUpdated = true;
              } else if (name === 'quickStartPopulation' || name === 'quickAnnualGrowthRate') {
                  const currentNumYears = newConfig.numYears;
                  const currentQuickStartPop = name === 'quickStartPopulation' ? numericValue : newConfig.quickStartPopulation;
                  const currentGrowthRate = name === 'quickAnnualGrowthRate' ? numericValue : newConfig.quickAnnualGrowthRate;
                  newPopulationValues = Array(currentNumYears).fill(currentQuickStartPop);
                  if (currentGrowthRate !== 0) {
                      for (let i = 1; i < currentNumYears; i++) {
                          newPopulationValues[i] = newPopulationValues[i-1] * (1 + currentGrowthRate / 100);
                      }
                  }
                  populationValuesUpdated = true;
              } else if (name === 'quickStartParkingSupply') {
                  const currentNumYears = newConfig.numYears;
                  newParkingSupplyValues = Array(currentNumYears).fill(numericValue);
                  parkingSupplyValuesUpdated = true;
              }
              if (populationValuesUpdated || parkingSupplyValuesUpdated) {
                setInputState(prevInput => ({
                    ...prevInput,
                    ...(populationValuesUpdated && { populationValues: newPopulationValues }),
                    ...(parkingSupplyValuesUpdated && { parkingSupplyValues: newParkingSupplyValues }),
                    ...(name === 'defaultParkingCost' && { parkingCost: numericValue }),
                }));
              }
              fetchBaselineData(newConfig);
              return newConfig;
          });
      } else {
          setIntermediateNumberInputs(prev => ({ ...prev, [name]: String(appConfig[name] || '') }));
      }
  }, [appConfig, inputState.populationValues, inputState.parkingSupplyValues, fetchBaselineData]);

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
                    const originalOtherShare = currentShares[k] || 0;
                    let reduction = (originalOtherShare / totalOtherSharesOriginal) * changeInThisMode;
                    newShares[k] = Math.max(0, originalOtherShare - reduction);
                });
            } else if (changeInThisMode < 0 && otherActiveKeys.length > 0) {
                const shareToAdd = -changeInThisMode / otherActiveKeys.length;
                otherActiveKeys.forEach(k => { newShares[k] = (newShares[k] || 0) + shareToAdd; });
            }
        }
        let currentTotal = 0;
        activeKeys.forEach(k => currentTotal += (newShares[k] || 0));
        if (Math.abs(currentTotal - 100) > 0.001 && currentTotal > 0) {
            activeKeys.forEach(k => { newShares[k] = ((newShares[k] || 0) / currentTotal) * 100; });
        }
        let roundedTotal = 0;
        activeKeys.forEach(k => {
            newShares[k] = Math.round((newShares[k] || 0) * 100) / 100;
            roundedTotal += newShares[k];
        });
        if (activeKeys.length > 0 && Math.abs(roundedTotal - 100) > 0.001) {
            const diff = 100 - roundedTotal;
            const keyToAdjust = newShares[modeKey] !== undefined ? modeKey : activeKeys[0];
            newShares[keyToAdjust] = (newShares[keyToAdjust] || 0) + diff;
            newShares[keyToAdjust] = Math.round(newShares[keyToAdjust] * 100) / 100;
        }
        activeKeys.forEach(k => { if (newShares[k] < 0) newShares[k] = 0; });
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
    const resetInputStateValues = {
      modeShares: { ...baselineModeShares },
      populationValues: resetPopulationValues,
      parkingSupplyValues: resetParkingValues,
      parkingCost: appConfig.defaultParkingCost,
    };
    setInputState(resetInputStateValues);
  }, [baselineModeShares, appConfig]);

  // Stubs for deferred advanced setup handlers
  const handleBaselineModeSelectionChange = useCallback(() => {}, []);
  const handleBaselineModeShareValueChange = useCallback(() => {}, []);
  const handleModeCustomizationChange = useCallback(() => {}, []);

  if (modesLoading) {
    return ( <ThemeProvider theme={theme}><CssBaseline /><Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /><Typography ml={2}>Loading Mode Configuration...</Typography></Box></ThemeProvider> );
  }
  if (modesError) {
    return ( <ThemeProvider theme={theme}><CssBaseline /><Container maxWidth="sm" sx={{ mt: 5 }}><Alert severity="error">Error loading application: {modesError}. Please check API and refresh.</Alert></Container></ThemeProvider> );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Outermost Box for sticky footer structure */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh' 
        }}
      >
        {/* AppBar */}
        <AppBar 
          position="static" 
          sx={{ 
            mb: 3, 
            bgcolor: theme.palette.primary.main,
            flexShrink: 0 // Prevent AppBar from shrinking
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>SEA MOVES</Typography>
            <Button component={NavLink} to="/" style={({ isActive }) => ({ color: 'white', fontWeight: isActive ? 'bold' : 'normal', marginRight: '15px' })}>Scenario Tool</Button>
            <Button component={NavLink} to="/setup" style={({ isActive }) => ({ color: 'white', fontWeight: isActive ? 'bold' : 'normal', marginRight: '15px' })}>Model Setup</Button>
          </Toolbar>
        </AppBar>

        {/* Main Content Area + Footer (Option 3: Footer INSIDE main content's Container) */}
        <Container 
          maxWidth="xl" 
          component="main" // Semantic tag for main content
          sx={{ 
            flexGrow: 1, // Allows this container to grow
            display: 'flex', // Use flex to manage children (Routes content + Footer)
            flexDirection: 'column', // Stack Routes content and Footer vertically
            py: 2 // Vertical padding for the content area
          }}
        >
          {/* This Box will wrap the Routes and allow it to grow, pushing the footer within this Container */}
          <Box sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={
                  <ScenarioPage
                    inputState={inputState}
                    apiResponseData={apiResponseData}
                    baselineApiResponseData={baselineApiResponseData}
                    activeModeDetails={activeModeDetails}
                    actualYears={actualYears}
                    sortedActiveModeKeys={sortedActiveModeKeysForDisplay}
                    isLoading={isLoading}
                    interactiveError={interactiveError}
                    baselineIsLoading={isBaselineLoading}
                    baselineError={baselineError}
                    onModeShareChange={handleModeShareChange}
                    onModeNumericInputCommit={handleModeNumericInputCommit}
                    onReset={handleReset}
                  /> } />
              <Route path="/setup" element={
                  <ModelSetupPage
                    baselineConfig={appConfig}
                    intermediateNumberInputs={intermediateNumberInputs}
                    onBaselineNumberInputChange={handleBaselineNumberInputChange}
                    onBaselineNumberCommit={handleBaselineNumberCommit}
                  /> } />
            </Routes>
          </Box>

          {/* Footer (now inside the main Container) */}
          <Box 
            component="footer" 
            sx={{ 
              textAlign: 'left', // As per your preference
              py: 2, 
              mt: 4, // Margin-top to space it from content above
              flexShrink: 0, // Prevent footer from shrinking
              borderTop: '1px solid',
              borderColor: 'divider',
              maxWidth: '1400px',
              // No specific backgroundColor needed if you want it to match Container's background
              // (which is usually transparent, inheriting from page body or parent Paper)
              // If you want it to look like a Paper element:
              // backgroundColor: theme.palette.background.paper, 
              // boxShadow: theme.shadows[1], // Optional shadow
            }}
          >
            {/* Content of the footer aligns naturally due to parent Container */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
              <img 
                src="/images/NUClogo.png" // Ensure this path is correct (logo in /public/images/NUClogo.png)
                alt="Nunes-Ueno Consulting Logo" 
                style={{ height: '30px', marginRight: '15px' }} 
              />
              <Typography variant="caption" component="span">
                © {new Date().getFullYear()} Nunes-Ueno Consulting.
              </Typography>
              {/* Example of a link if you want one:
              <Link href="https://www.nunes-ueno.com" target="_blank" rel="noopener noreferrer" sx={{ml:1}}>
                  nunes-ueno.com
              </Link>
              */}
            </Box>
          </Box>
        </Container> {/* End of Main Content Area + Footer Container */}
      </Box> {/* End of Outermost Box for sticky footer */}
    </ThemeProvider>
  );
}

export default App;