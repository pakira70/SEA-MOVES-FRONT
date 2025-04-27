// src/pages/ScenarioPage.jsx - COMPLETE CODE with CORRECTED Trip Delta Calculation

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Grid, Paper, Typography, CircularProgress, Box } from '@mui/material';

import ControlsPanel from '../components/ControlsPanel.jsx';
import VisualizationsPanel from '../components/VisualizationsPanel.jsx';
import FinalCostDisplay from '../components/FinalCostDisplay.jsx';
import TripDeltaDisplay from '../components/TripDeltaDisplay.jsx';

const getLastElement = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) { return undefined; }
    return arr[arr.length - 1];
};

// Helper to get an element at a specific index (e.g., the last index)
const getElementAtIndex = (arr, index) => {
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) { return undefined; }
    return arr[index];
};


function ScenarioPage({
  baselineState,
  inputState,
  apiResponseData,
  baselineApiResponseData,
  modes,
  actualYears, // We might not need this if using array index
  isLoading,
  interactiveError,
  baselineIsLoading,
  baselineError,
  onModeShareChange,
  onModeNumericInputCommit,
  onReset,
}) {

    // --- Baseline Cost/Shortfall Calculation (No change needed) ---
    const { baselineFinalYearCost, baselineFinalYearShortfall } = useMemo(() => {
        const result = { baselineFinalYearCost: null, baselineFinalYearShortfall: null };
        if (!baselineApiResponseData?.parking) { return result; }
        const costPerYearArray = baselineApiResponseData.parking.cost_per_year;
        result.baselineFinalYearCost = getLastElement(costPerYearArray);
        const shortfallPerYearArray = baselineApiResponseData.parking.shortfall_per_year;
        result.baselineFinalYearShortfall = Math.round(getLastElement(shortfallPerYearArray) ?? 0);
        return result;
    }, [baselineApiResponseData]);

    // --- Scenario Cost/Shortfall Calculation (No change needed) ---
    const { scenarioFinalYearCost, scenarioFinalYearShortfall } = useMemo(() => {
        const result = { scenarioFinalYearCost: null, scenarioFinalYearShortfall: null };
        if (!apiResponseData?.parking) { return result; }
        const costPerYearArray = apiResponseData.parking.cost_per_year;
        result.scenarioFinalYearCost = getLastElement(costPerYearArray);
        const shortfallPerYearArray = apiResponseData.parking.shortfall_per_year;
        result.scenarioFinalYearShortfall = Math.round(getLastElement(shortfallPerYearArray) ?? 0);
        return result;
    }, [apiResponseData]);

    // --- Calculate Trip Deltas for FINAL YEAR using useMemo --- (CORRECTED LOGIC) ---
    const finalYearTripDeltas = useMemo(() => {
        console.log("[Memo - Trip Deltas] Calculating Absolute Trips...");
        const deltas = {};
        const modeKeys = Object.keys(modes || {});

        // --- Check Prerequisites ---
        if (!apiResponseData?.trips_per_mode_per_year || !apiResponseData?.population_per_year ||
            !baselineApiResponseData?.trips_per_mode_per_year || !baselineApiResponseData?.population_per_year ||
            modeKeys.length === 0 ) {
            console.warn("[Memo - Trip Deltas] Missing required data arrays (trips_per_mode_per_year, population_per_year, or modes).");
             modeKeys.forEach(key => { deltas[key] = null; });
            return deltas;
        }

        const scenarioRatesPerModePerYear = apiResponseData.trips_per_mode_per_year;
        const baselineRatesPerModePerYear = baselineApiResponseData.trips_per_mode_per_year;
        const scenarioPopulationPerYear = apiResponseData.population_per_year;
        const baselinePopulationPerYear = baselineApiResponseData.population_per_year;

        // --- Get Final Year Index ---
        // Ensure arrays have the same length before proceeding
        const numYears = scenarioPopulationPerYear.length;
        if (numYears === 0 || baselinePopulationPerYear.length !== numYears) {
             console.warn("[Memo - Trip Deltas] Population array lengths mismatch or zero.");
             modeKeys.forEach(key => { deltas[key] = null; });
             return deltas;
        }
        const finalYearIndex = numYears - 1;

        // --- Get Final Year Population ---
        const scenarioFinalPopulation = getElementAtIndex(scenarioPopulationPerYear, finalYearIndex);
        const baselineFinalPopulation = getElementAtIndex(baselinePopulationPerYear, finalYearIndex);

        if (scenarioFinalPopulation === undefined || baselineFinalPopulation === undefined) {
             console.warn("[Memo - Trip Deltas] Could not get final year population.");
             modeKeys.forEach(key => { deltas[key] = null; });
             return deltas;
        }
        console.log(`[Memo - Trip Deltas] Final Pop - Scenario: ${scenarioFinalPopulation}, Baseline: ${baselineFinalPopulation}`);


        // --- Calculate Absolute Trips and Deltas ---
        modeKeys.forEach((modeKey) => {
            // Get rate arrays for the mode
            const scenarioModeRateArray = Array.isArray(scenarioRatesPerModePerYear?.[modeKey]) ? scenarioRatesPerModePerYear[modeKey] : [];
            const baselineModeRateArray = Array.isArray(baselineRatesPerModePerYear?.[modeKey]) ? baselineRatesPerModePerYear[modeKey] : [];

            // Get final year rates
            const scenarioFinalRate = getElementAtIndex(scenarioModeRateArray, finalYearIndex);
            const baselineFinalRate = getElementAtIndex(baselineModeRateArray, finalYearIndex);

            console.log(`[Memo - Trip Deltas] Mode: ${modeKey} | Final Rates - Scenario: ${scenarioFinalRate}, Baseline: ${baselineFinalRate}`);

            // Convert rates and population to numbers
            const scRateNum = Number(scenarioFinalRate ?? NaN);
            const blRateNum = Number(baselineFinalRate ?? NaN);
            const scPopNum = Number(scenarioFinalPopulation);
            const blPopNum = Number(baselineFinalPopulation);


            if (!isNaN(scRateNum) && !isNaN(blRateNum) && !isNaN(scPopNum) && !isNaN(blPopNum)) {
                // Calculate absolute trips assuming rate is per 100 people
                const scenarioAbsoluteTrips = (scPopNum / 100) * scRateNum;
                const baselineAbsoluteTrips = (blPopNum / 100) * blRateNum;

                 console.log(`[Memo - Trip Deltas] Mode: ${modeKey} | Abs Trips - Scenario: ${scenarioAbsoluteTrips.toFixed(1)}, Baseline: ${baselineAbsoluteTrips.toFixed(1)}`);

                // Calculate the delta
                deltas[modeKey] = scenarioAbsoluteTrips - baselineAbsoluteTrips;

            } else {
                console.warn(`[Memo - Trip Deltas] Non-numeric rate or pop for mode: ${modeKey}. Setting delta to null.`);
                deltas[modeKey] = null; // Assign null for invalid data
            }
             console.log(`[Memo - Trip Deltas] Mode: ${modeKey} | Calculated Delta: ${deltas[modeKey]?.toFixed(1)}`);
        });

        console.log("[Memo - Trip Deltas] FINAL Calculated deltas object:", deltas);
        return deltas;

    }, [apiResponseData, baselineApiResponseData, modes]);
    // --- End of Trip Delta Calculation ---


    const finalYear = actualYears && actualYears.length > 0 ? getLastElement(actualYears) : null;
    const canShowDeltaDisplay = useMemo(() => Object.keys(modes || {}).length > 0, [modes]);

    return (
        <Grid container spacing={3}>
            {/* Top Row */}
            <Grid item xs={12}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 430, position: 'relative', overflow: 'hidden' }}>
                            <Typography variant="h6" gutterBottom>Visualizations</Typography>
                            {!apiResponseData && isLoading && !interactiveError && ( <Box sx={styles.centerBox}><CircularProgress /></Box> )}
                            {!apiResponseData && interactiveError && ( <Box sx={styles.centerBox}><Typography color="error">Error loading scenario: {interactiveError}</Typography></Box> )}
                            {!apiResponseData && !isLoading && !interactiveError && ( <Box sx={styles.centerBox}><Typography>Adjust inputs to generate scenario results.</Typography></Box> )}
                            {apiResponseData && (<VisualizationsPanel data={apiResponseData} modes={modes} actualYears={actualYears} />)}
                            {isLoading && apiResponseData && ( <Box sx={styles.loadingOverlay}><CircularProgress size={40} /></Box> )}
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <FinalCostDisplay
                                baselineCost={baselineFinalYearCost}
                                scenarioCost={scenarioFinalYearCost}
                                baselineShortfall={baselineFinalYearShortfall}
                                scenarioShortfall={scenarioFinalYearShortfall}
                                baselineCostLoading={baselineIsLoading}
                                baselineCostError={baselineError}
                                scenarioLoading={isLoading}
                                scenarioError={interactiveError}
                                finalYear={finalYear}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </Grid>

            {/* Middle Row */}
            <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" gutterBottom>
                        Change in Daily Trips ({finalYear ?? 'Final Year'}) vs Baseline
                    </Typography>
                     {(baselineIsLoading || isLoading) && (
                         <Box sx={styles.centerBoxSmall}><CircularProgress size={24} /></Box>
                     )}
                     {(!baselineIsLoading && !isLoading && (baselineError || interactiveError)) && (
                         <Typography color="error" sx={{p:1}}>Cannot calculate trip deltas due to data errors.</Typography>
                     )}
                     {!baselineIsLoading && !isLoading && !baselineError && !interactiveError && canShowDeltaDisplay && (
                         <TripDeltaDisplay
                             deltas={finalYearTripDeltas}
                             modes={modes}
                         />
                     )}
                      {!baselineIsLoading && !isLoading && !baselineError && !interactiveError && !canShowDeltaDisplay && (
                         <Typography sx={{p:1, fontStyle: 'italic'}}>Mode configuration missing.</Typography>
                     )}
                </Paper>
            </Grid>

            {/* Bottom Row */}
            <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" gutterBottom>Interactive Scenario Inputs</Typography>
                    <ControlsPanel
                        inputState={inputState}
                        modes={modes}
                        onModeShareChange={onModeShareChange}
                        onModeNumericInputCommit={onModeNumericInputCommit}
                        onReset={onReset}
                        isLoading={isLoading}
                    />
                </Paper>
            </Grid>
        </Grid>
    );
}

ScenarioPage.propTypes = {
    baselineState: PropTypes.object.isRequired,
    inputState: PropTypes.object.isRequired,
    apiResponseData: PropTypes.object,
    baselineApiResponseData: PropTypes.object,
    modes: PropTypes.object.isRequired,
    actualYears: PropTypes.arrayOf(PropTypes.number).isRequired,
    isLoading: PropTypes.bool.isRequired,
    interactiveError: PropTypes.string,
    baselineIsLoading: PropTypes.bool.isRequired,
    baselineError: PropTypes.string,
    onModeShareChange: PropTypes.func.isRequired,
    onModeNumericInputCommit: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
};

const styles = {
  centerBox: { display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', textAlign: 'center', p: 2 },
  centerBoxSmall: { display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, minHeight: '50px'},
  loadingOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backdropFilter: 'blur(1px)', borderRadius: 'inherit' }
};

export default ScenarioPage;