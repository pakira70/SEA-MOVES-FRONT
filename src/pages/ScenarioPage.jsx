// src/pages/ScenarioPage.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Grid, Paper, Typography, CircularProgress, Box } from '@mui/material';

// Import Child Components
import ControlsPanel from '../components/ControlsPanel.jsx';
import VisualizationsPanel from '../components/VisualizationsPanel.jsx';
import FinalCostDisplay from '../components/FinalCostDisplay.jsx';
import TripDeltaDisplay from '../components/TripDeltaDisplay.jsx';

// --- Helper functions ---
const getLastElement = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) { return undefined; }
    return arr[arr.length - 1];
};
const getElementAtIndex = (arr, index) => {
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) { return undefined; }
    return arr[index];
};

// --- Prop types ---
const modeDetailsShape = PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    flags: PropTypes.object,
});

// --- Component Definition ---
function ScenarioPage({
  inputState,
  apiResponseData,
  baselineApiResponseData,
  activeModeDetails,
  actualYears,
  sortedActiveModeKeys, // <<<<<<<<<<<< ADDED: Prop for sorted keys
  isLoading,
  interactiveError,
  baselineIsLoading,
  baselineError,
  onModeShareChange,
  onModeNumericInputCommit,
  onReset,
}) {
    // Use sortedActiveModeKeys if available, otherwise fallback (though App.jsx should always provide it)
    const keysForDisplay = useMemo(() => {
        if (Array.isArray(sortedActiveModeKeys) && sortedActiveModeKeys.length > 0) {
            return sortedActiveModeKeys;
        }
        return activeModeDetails ? Object.keys(activeModeDetails) : [];
    }, [sortedActiveModeKeys, activeModeDetails]);


    const finalYear = useMemo(() => (actualYears && actualYears.length > 0 ? getLastElement(actualYears) : null), [actualYears]);
    const canShowDeltaDisplay = useMemo(() => keysForDisplay.length > 0, [keysForDisplay]);

    const { baselineFinalYearCost, baselineFinalYearShortfall } = useMemo(() => {
        const result = { baselineFinalYearCost: null, baselineFinalYearShortfall: null };
        if (!baselineApiResponseData?.parking?.cost_per_year || !baselineApiResponseData?.parking?.shortfall_per_year) {
             return result; 
        }
        try {
            result.baselineFinalYearCost = getLastElement(baselineApiResponseData.parking.cost_per_year);
            result.baselineFinalYearShortfall = Math.round(getLastElement(baselineApiResponseData.parking.shortfall_per_year) ?? 0);
        } catch (error) {
            console.error("[Memo - Baseline Cost/Shortfall] Error during calculation:", error);
            return { baselineFinalYearCost: null, baselineFinalYearShortfall: null };
        }
        return result; 
    }, [baselineApiResponseData]);

    const { scenarioFinalYearCost, scenarioFinalYearShortfall } = useMemo(() => {
        const result = { scenarioFinalYearCost: null, scenarioFinalYearShortfall: null };
         if (!apiResponseData?.parking?.cost_per_year || !apiResponseData?.parking?.shortfall_per_year) {
            return result; 
        }
        try {
            result.scenarioFinalYearCost = getLastElement(apiResponseData.parking.cost_per_year);
            result.scenarioFinalYearShortfall = Math.round(getLastElement(apiResponseData.parking.shortfall_per_year) ?? 0);
        } catch (error) {
            console.error("[Memo - Scenario Cost/Shortfall] Error during calculation:", error);
            return { scenarioFinalYearCost: null, scenarioFinalYearShortfall: null };
        }
        return result; 
    }, [apiResponseData]);

    const finalYearTripDeltas = useMemo(() => {
        const deltas = {}; 
        if (!keysForDisplay || keysForDisplay.length === 0) { console.warn("[Memo - Trip Deltas] No keysForDisplay."); return deltas; }

        const scenarioTrips = apiResponseData?.trips_per_mode_per_year;
        const baselineTrips = baselineApiResponseData?.trips_per_mode_per_year;
        const scenarioPop = apiResponseData?.population_per_year;
        const baselinePop = baselineApiResponseData?.population_per_year;

        if (!scenarioTrips || !baselineTrips || !scenarioPop || !baselinePop) {
            console.warn("[Memo - Trip Deltas] Missing API data arrays.");
            return deltas; 
        }
        const numYears = scenarioPop.length;
        if (numYears === 0 || baselinePop.length !== numYears) {
            console.warn("[Memo - Trip Deltas] Pop length mismatch or zero.");
            return deltas; 
        }
        const finalYearIndex = numYears - 1;

        try {
            // Iterate using keysForDisplay (which is sorted or fallback)
            keysForDisplay.forEach((modeKey) => {
                // Ensure modeKey actually exists in activeModeDetails before proceeding,
                // as keysForDisplay might be from sortedActiveModeKeys which could momentarily
                // be out of sync if activeModeDetails updates separately.
                if (!activeModeDetails[modeKey]) return;


                const scenarioModeTripArray = Array.isArray(scenarioTrips?.[modeKey]) ? scenarioTrips[modeKey] : [];
                const baselineModeTripArray = Array.isArray(baselineTrips?.[modeKey]) ? baselineTrips[modeKey] : [];
                const scenarioFinalTrips = getElementAtIndex(scenarioModeTripArray, finalYearIndex);
                const baselineFinalTrips = getElementAtIndex(baselineModeTripArray, finalYearIndex);
                const scTripNum = Number(scenarioFinalTrips ?? NaN);
                const blTripNum = Number(baselineFinalTrips ?? NaN);
                if (!isNaN(scTripNum) && !isNaN(blTripNum)) {
                    deltas[modeKey] = scTripNum - blTripNum;
                } else {
                    deltas[modeKey] = null; 
                }
            });
        } catch (error) {
             console.error("[Memo - Trip Deltas] Error during calculation:", error);
             return {};
        }
        return deltas; 
    }, [apiResponseData, baselineApiResponseData, keysForDisplay, activeModeDetails]); // Added activeModeDetails dependency

    const baselineParkingDemand = useMemo(() => {
        return baselineApiResponseData?.parking?.demand_per_year ?? [];
    }, [baselineApiResponseData]);

    const adjustedScenarioParkingDemand = useMemo(() => {
        const rawScenarioDemand = apiResponseData?.parking?.demand_per_year;
        if (!Array.isArray(baselineParkingDemand) || baselineParkingDemand.length === 0 || 
            !Array.isArray(rawScenarioDemand) || rawScenarioDemand.length === 0 ||
            baselineParkingDemand.length !== rawScenarioDemand.length) { 
            return rawScenarioDemand || []; 
        }
        const adjusted = [...rawScenarioDemand]; 
        adjusted[0] = baselineParkingDemand[0]; // Set first year of scenario demand to baseline
        return adjusted;
    }, [baselineParkingDemand, apiResponseData?.parking?.demand_per_year]);


    return (
        <Grid container spacing={3}>
            {/* Top Row */}
            <Grid item xs={12}>
                <Grid container spacing={3}>
                    {/* Visualizations Panel */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 430, position: 'relative', overflow: 'hidden' }}>
                            <Typography variant="h6" gutterBottom>Visualizations</Typography>
                            {!apiResponseData && isLoading && !interactiveError && ( <Box sx={styles.centerBox}><CircularProgress /></Box> )}
                            {!apiResponseData && interactiveError && ( <Box sx={styles.centerBox}><Typography color="error">Error loading scenario: {interactiveError}</Typography></Box> )}
                            {!apiResponseData && !isLoading && !interactiveError && ( <Box sx={styles.centerBox}><Typography>Adjust inputs to generate scenario results.</Typography></Box> )}
                            {apiResponseData && activeModeDetails && Object.keys(activeModeDetails).length > 0 ? (
                                <VisualizationsPanel
                                    scenarioData={apiResponseData} 
                                    baselineParkingDemand={baselineParkingDemand}
                                    adjustedScenarioParkingDemand={adjustedScenarioParkingDemand} 
                                    activeModeDetails={activeModeDetails}
                                    // sortedActiveModeKeys={keysForDisplay} // VisualizationsPanel doesn't need sorted keys itself
                                    actualYears={actualYears}
                                />
                            ) : ( !isLoading && !interactiveError && <Box sx={styles.centerBox}><Typography>Waiting for data or mode configuration...</Typography></Box> )}
                            {isLoading && apiResponseData && ( <Box sx={styles.loadingOverlay}><CircularProgress size={40} /></Box> )}
                        </Paper>
                    </Grid>
                    {/* Final Cost Display */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <FinalCostDisplay
                                baselineCost={baselineFinalYearCost} scenarioCost={scenarioFinalYearCost}
                                baselineShortfall={baselineFinalYearShortfall} scenarioShortfall={scenarioFinalYearShortfall}
                                baselineCostLoading={baselineIsLoading} baselineCostError={baselineError}
                                scenarioLoading={isLoading} scenarioError={interactiveError} finalYear={finalYear}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </Grid>

            {/* Middle Row (TripDeltaDisplay) */}
            <Grid item xs={12}>
                 <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 188 }}>
                    <Typography variant="h6" gutterBottom> Change in Daily Trips ({finalYear ?? 'Final Year'}) vs Baseline </Typography>
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {(baselineIsLoading || isLoading) ? ( <CircularProgress size={24} /> )
                         : (baselineError || interactiveError) ? ( <Typography color="error" sx={{p:1, textAlign:'center'}}>Cannot calculate trip deltas due to data errors.</Typography> )
                         : (!canShowDeltaDisplay || !activeModeDetails) ? ( <Typography sx={{p:1, fontStyle: 'italic', textAlign:'center'}}>No active modes selected.</Typography> )
                         : (finalYearTripDeltas && Object.keys(finalYearTripDeltas).length > 0) ? (
                            <TripDeltaDisplay 
                                deltas={finalYearTripDeltas} 
                                activeModeDetails={activeModeDetails} 
                                sortedActiveModeKeys={keysForDisplay} // <<<<<<<<<<<< PASSING SORTED KEYS
                            />
                         ) : ( <Typography sx={{p:1, fontStyle: 'italic', textAlign:'center'}}>Awaiting delta calculation or data...</Typography> )}
                    </Box>
                </Paper>
            </Grid>

           {/* Bottom Row (ControlsPanel) */}
            <Grid item xs={12}>
                 <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" gutterBottom>Interactive Scenario Inputs</Typography>
                    {activeModeDetails && Object.keys(activeModeDetails).length > 0 ? (
                        <ControlsPanel
                            inputState={inputState} 
                            activeModeDetails={activeModeDetails}
                            sortedActiveModeKeys={keysForDisplay} // <<<<<<<<<<<< PASSING SORTED KEYS
                            onModeShareChange={onModeShareChange} 
                            onModeNumericInputCommit={onModeNumericInputCommit}
                            onReset={onReset} 
                            isLoading={isLoading}
                        />
                    ) : ( <Typography sx={{p:1, fontStyle: 'italic'}}>Loading mode configuration...</Typography> )}
                </Paper>
            </Grid>
        </Grid>
    );
}

// --- PropTypes ---
ScenarioPage.propTypes = {
    inputState: PropTypes.object.isRequired,
    apiResponseData: PropTypes.object,
    baselineApiResponseData: PropTypes.object,
    activeModeDetails: PropTypes.objectOf(modeDetailsShape).isRequired,
    actualYears: PropTypes.arrayOf(PropTypes.number).isRequired,
    sortedActiveModeKeys: PropTypes.arrayOf(PropTypes.string), // <<<<<<<<<<<< ADDED PropTypes
    isLoading: PropTypes.bool.isRequired,
    interactiveError: PropTypes.string,
    baselineIsLoading: PropTypes.bool.isRequired,
    baselineError: PropTypes.string,
    onModeShareChange: PropTypes.func.isRequired,
    onModeNumericInputCommit: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
};

// Add defaultProp for sortedActiveModeKeys
ScenarioPage.defaultProps = {
    apiResponseData: null,
    baselineApiResponseData: null,
    interactiveError: null,
    baselineError: null,
    sortedActiveModeKeys: [], // <<<<<<<<<<<< ADDED defaultProp
};


// --- Styles ---
const styles = {
  centerBox: { display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', textAlign: 'center', p: 2 },
  centerBoxSmall: { display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, minHeight: '50px'},
  loadingOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backdropFilter: 'blur(1px)', borderRadius: 'inherit' }
};

export default ScenarioPage;