// src/pages/ScenarioPage.jsx - FINAL RECOVERY VERSION (WITH STYLES OBJECT)
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Grid, Paper, Typography, CircularProgress, Box } from '@mui/material';

import ControlsPanel from '../components/ControlsPanel.jsx';
import VisualizationsPanel from '../components/VisualizationsPanel.jsx';
import TripDeltaDisplay from '../components/TripDeltaDisplay.jsx';
import ImpactCard from '../components/ImpactCard.jsx';

const getLastElement = (arr) => (!Array.isArray(arr) || arr.length === 0 ? undefined : arr[arr.length - 1]);
const getElementAtIndex = (arr, index) => (!Array.isArray(arr) || index < 0 || index >= arr.length ? undefined : arr[index]);
const sumArray = (arr) => (Array.isArray(arr) ? arr.reduce((sum, val) => sum + val, 0) : null);

const modeDetailsShape = PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    flags: PropTypes.object,
});

function ScenarioPage({
  inputState, apiResponseData, baselineApiResponseData, activeModeDetails,
  actualYears, sortedActiveModeKeys, isLoading, interactiveError,
  onModeShareChange, onModeNumericInputCommit, onReset,
}) {
    const finalYear = useMemo(() => (actualYears && actualYears.length > 0 ? getLastElement(actualYears) : 'Final Year'), [actualYears]);
    const numYears = useMemo(() => actualYears?.length || 0, [actualYears]);
    
    const hasData = !isLoading && !interactiveError && apiResponseData && baselineApiResponseData;

    const parkingImpactProps = useMemo(() => ({
        title: `Parking Capital Cost (${numYears} yrs)`, 
        metricLabel: "stalls needed",
        finalYear: finalYear,
        baselineCost: sumArray(baselineApiResponseData?.parking?.cost_per_year),
        scenarioCost: sumArray(apiResponseData?.parking?.cost_per_year),
        baselineMetricValue: getLastElement(baselineApiResponseData?.parking?.demand_per_year),
        scenarioMetricValue: getLastElement(apiResponseData?.parking?.demand_per_year),
    }), [baselineApiResponseData, apiResponseData, finalYear, numYears]);

    const shuttleImpactProps = useMemo(() => {
        const isShuttleActive = baselineApiResponseData?.shuttle?.annual_cost_per_year?.length > 0;
        if (!isShuttleActive) return { showCard: false };

        const baselineTotalCost = sumArray(baselineApiResponseData?.shuttle?.annual_cost_per_year);
        const scenarioTotalCost = sumArray(apiResponseData?.shuttle?.annual_cost_per_year);

        return {
            showCard: true, title: `Shuttle Operations Impact (${numYears} yrs)`, metricLabel: "shuttles needed", finalYear: finalYear,
            baselineCost: baselineTotalCost,
            scenarioCost: scenarioTotalCost,
            baselineMetricValue: getLastElement(baselineApiResponseData?.shuttle?.total_shuttles_per_year),
            scenarioMetricValue: getLastElement(apiResponseData?.shuttle?.total_shuttles_per_year),
        };
    }, [baselineApiResponseData, apiResponseData, finalYear, numYears]);

    const finalYearTripDeltas = useMemo(() => {
        const deltas = {};
        if (!hasData || !sortedActiveModeKeys.length) return deltas;
        const finalYearIndex = (apiResponseData.years?.length ?? 1) - 1;
        if (finalYearIndex < 0) return deltas;
        sortedActiveModeKeys.forEach((modeKey) => {
            const scenarioFinalTrips = getElementAtIndex(apiResponseData.trips_per_mode_per_year?.[modeKey], finalYearIndex);
            const baselineFinalTrips = getElementAtIndex(baselineApiResponseData.trips_per_mode_per_year?.[modeKey], finalYearIndex);
            if (scenarioFinalTrips !== undefined && baselineFinalTrips !== undefined) {
                deltas[modeKey] = scenarioFinalTrips - baselineFinalTrips;
            }
        });
        return deltas;
    }, [hasData, apiResponseData, baselineApiResponseData, sortedActiveModeKeys]);

    return (
        <Grid container spacing={3}>
            {/* --- TOP ROW: VISUALIZATIONS --- */}
            <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: {xs: 300, md: 500}, position: 'relative', overflow: 'hidden' }}>
                    <Typography variant="h6" gutterBottom>Visualizations</Typography>
                    {isLoading && (<Box sx={styles.centerBox}><CircularProgress /></Box>)}
                    {interactiveError && (<Box sx={styles.centerBox}><Typography color="error">Error: {interactiveError}</Typography></Box>)}
                    {!isLoading && !interactiveError && !hasData && (<Box sx={styles.centerBox}><Typography>Adjust inputs to generate results.</Typography></Box>)}
                    
                    {hasData && (
                        <VisualizationsPanel
                            modeShares={apiResponseData.processed_mode_shares}
                            parkingSupply={apiResponseData.parking.supply_per_year}
                            parkingDemand={apiResponseData.parking.demand_per_year}
                            baselineParkingDemand={baselineApiResponseData.parking.demand_per_year}
                            activeModeDetails={activeModeDetails}
                            actualYears={actualYears}
                        />
                    )}
                    {isLoading && hasData && (<Box sx={styles.loadingOverlay}><CircularProgress size={40} /></Box>)}
                </Paper>
            </Grid>

            {/* --- NEW ROW: IMPACT CARDS --- */}
            <Grid item xs={12}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ height: '100%' }}>
                           <ImpactCard isLoading={isLoading} error={interactiveError} {...parkingImpactProps} />
                        </Paper>
                    </Grid>
                    {hasData && shuttleImpactProps.showCard && (
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ height: '100%' }}>
                                <ImpactCard isLoading={isLoading} error={interactiveError} {...shuttleImpactProps} />
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Grid>
            
            {/* --- Trip Delta Display --- */}
            <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 188 }}>
                    <Typography variant="h6" gutterBottom>Change in Daily Trips ({finalYear}) vs Baseline</Typography>
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {isLoading ? (<CircularProgress size={24} />)
                         : interactiveError ? (<Typography color="error">Cannot calculate deltas.</Typography>)
                         : hasData && Object.keys(finalYearTripDeltas).length > 0 ? (
                            <TripDeltaDisplay deltas={finalYearTripDeltas} activeModeDetails={activeModeDetails} sortedActiveModeKeys={sortedActiveModeKeys} />
                         ) : (<Typography sx={{ fontStyle: 'italic' }}>Awaiting data...</Typography>)}
                    </Box>
                </Paper>
            </Grid>

            {/* --- Controls Panel --- */}
           <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Interactive Scenario Inputs</Typography>
                    <ControlsPanel
                        inputState={inputState} activeModeDetails={activeModeDetails} sortedActiveModeKeys={sortedActiveModeKeys}
                        onModeShareChange={onModeShareChange} onModeNumericInputCommit={onModeNumericInputCommit}
                        onReset={onReset} isLoading={isLoading}
                    />
                </Paper>
            </Grid>
        </Grid>
    );
}

ScenarioPage.propTypes = {
    inputState: PropTypes.object.isRequired,
    apiResponseData: PropTypes.object,
    baselineApiResponseData: PropTypes.object,
    activeModeDetails: PropTypes.object.isRequired,
    actualYears: PropTypes.arrayOf(PropTypes.number).isRequired,
    sortedActiveModeKeys: PropTypes.arrayOf(PropTypes.string),
    isLoading: PropTypes.bool.isRequired,
    interactiveError: PropTypes.string,
    onModeShareChange: PropTypes.func.isRequired,
    onModeNumericInputCommit: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
};

ScenarioPage.defaultProps = {
    apiResponseData: null,
    baselineApiResponseData: null,
    interactiveError: null,
    sortedActiveModeKeys: [],
};

// THIS OBJECT HAS BEEN RESTORED
const styles = {
  centerBox: { display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', textAlign: 'center', p: 2 },
  loadingOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, backdropFilter: 'blur(1px)', borderRadius: 'inherit' }
};

export default ScenarioPage;