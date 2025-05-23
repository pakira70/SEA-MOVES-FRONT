// src/components/TripDeltaDisplay.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Box, Typography, Paper } from '@mui/material';

// Import Icons - Ensure all icons you might use are imported
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit'; // For TRANSIT
import HailIcon from '@mui/icons-material/Hail';                     // For DROPOFF
import GroupsIcon from '@mui/icons-material/Groups';                 // For CARPOOL, VANPOOL
import TramIcon from '@mui/icons-material/Tram';                     // For TRAIN, SUBWAY, MONORAIL (example)
import CommuteIcon from '@mui/icons-material/Commute';               // For FERRY (example)
import EditRoadIcon from '@mui/icons-material/EditRoad';             // For OTHER slots
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';       // Default

// --- Icon Mapping ---
// Keys MUST exactly match the 'key' field from AVAILABLE_MODES in app.py
const modeIcons = {
    "DRIVE": DirectionsCarIcon,
    "WALK": DirectionsWalkIcon,
    "BIKE": DirectionsBikeIcon,
    "TRANSIT": DirectionsTransitIcon,
    "DROPOFF": HailIcon,
    "CARPOOL": GroupsIcon,
    "VANPOOL": GroupsIcon,
    "BEV": DirectionsCarIcon,
    "MOTORCYCLE": DirectionsCarIcon,
    "MOPED": DirectionsCarIcon,
    "E_BIKE": DirectionsBikeIcon,
    "SKATEBOARD": DirectionsBikeIcon,
    "REGIONAL_TRAIL": DirectionsWalkIcon,
    "TRAIN": TramIcon,
    "SUBWAY": TramIcon,
    "MONORAIL": TramIcon,
    "FERRY": CommuteIcon,
    "OTHER_1": EditRoadIcon,
    "OTHER_2": EditRoadIcon,
    "DEFAULT": HelpOutlineIcon,
};

// --- Helper Functions ---
const formatDelta = (delta) => {
    if (typeof delta !== 'number' || isNaN(delta)) {
        if (delta === null || delta === undefined) return '-';
        return '-';
    }
    const roundedDelta = Math.round(delta);
    if (roundedDelta === 0) return "0";
    return roundedDelta > 0 ? `+${roundedDelta}` : `${roundedDelta}`;
};

const getColorForDelta = (delta) => {
    if (typeof delta !== 'number' || isNaN(delta) || delta === 0 || delta === null || delta === undefined) {
        return 'text.secondary';
    }
    return delta > 0 ? 'success.main' : 'error.main';
};

// --- Prop type ---
const modeDetailsShape = PropTypes.shape({
    key: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    flags: PropTypes.object, // You can be more specific if needed
    // parking_factor_per_person: PropTypes.number, // if used directly by this component
});

// --- Component Definition ---
function TripDeltaDisplay({ deltas, activeModeDetails, sortedActiveModeKeys }) {
  // CRITICAL LOG for receiving sorted keys
  console.log("[CRITICAL_PROP_LOG] TripDeltaDisplay.jsx - RECEIVED sortedActiveModeKeys:", JSON.stringify(sortedActiveModeKeys));

  const keysToIterate = (Array.isArray(sortedActiveModeKeys) && sortedActiveModeKeys.length > 0)
                        ? sortedActiveModeKeys
                        : Object.keys(activeModeDetails || {});
  // CRITICAL LOG for the actual keys being used to map
  console.log("[CRITICAL_PROP_LOG] TripDeltaDisplay.jsx - keysToIterate (used for .map):", JSON.stringify(keysToIterate));

  if (keysToIterate.length === 0) {
    return <Typography sx={{ p: 2, fontStyle: 'italic', textAlign: 'center' }}>No selected modes or data available to display deltas.</Typography>;
  }

  return (
    <Grid container spacing={2} alignItems="stretch">
        {keysToIterate.map((modeKey, index) => { // Added 'index'
            const modeInfo = activeModeDetails[modeKey];
            if (!modeInfo) {
                console.warn(`[RENDER_ORDER_DEBUG] TripDeltaDisplay: No modeInfo found for key: ${modeKey} at index ${index}. Skipping render for this item.`);
                return null; // Skip rendering if modeInfo is missing for a key
            }

            const modeName = modeInfo.name || modeKey; // Fallback to key if name is missing
            const deltaValue = (deltas && deltas[modeKey] !== undefined) ? deltas[modeKey] : null;
            const formattedValue = formatDelta(deltaValue);
            const color = getColorForDelta(deltaValue);
            const IconComponent = modeIcons[modeKey] || modeIcons["DEFAULT"];

            // Log the order it *thinks* it's rendering
            console.log(`[RENDER_ORDER_DEBUG] TripDeltaDisplay: Rendering item ${index + 1} - ${modeKey} - ${modeName}`);

            return (
                // Adjusted Grid item sizing for potentially 7 items.
                // xs={6} (2 per row on extra small)
                // sm={4} (3 per row on small)
                // md={3} (4 per row on medium)
                // lg={2} (6 per row on large, will wrap for 7th item)
                // You might need to adjust these based on your desired layout for 7 items.
                // Using lg={Math.floor(12 / Math.min(keysToIterate.length, 6))} could be dynamic but complex.
                // For 7 items, lg={2} means 6 fit, 1 wraps. Or adjust padding/spacing.
                <Grid item xs={6} sm={4} md={3} lg={2} key={modeKey} >
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 140 }}>
                        <IconComponent sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5, wordBreak: 'break-word' }}>
                            {modeName}
                        </Typography>
                        <Typography variant="h6" sx={{ color: color, fontWeight: 'bold', mb: 0.5 }}>
                            {formattedValue}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            trips/day
                        </Typography>
                    </Paper>
                </Grid>
            );
        })}
    </Grid>
  );
}

// --- PropTypes ---
TripDeltaDisplay.propTypes = {
    deltas: PropTypes.object,
    activeModeDetails: PropTypes.objectOf(modeDetailsShape).isRequired,
    sortedActiveModeKeys: PropTypes.arrayOf(PropTypes.string),
};

// --- Default Props ---
TripDeltaDisplay.defaultProps = {
    deltas: {},
    // activeModeDetails: {}, // It's required, so no default needed if App.jsx always provides it
    sortedActiveModeKeys: [],
};

export default TripDeltaDisplay;