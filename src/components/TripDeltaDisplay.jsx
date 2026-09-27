// src/components/TripDeltaDisplay.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Paper } from '@mui/material';

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
  const keysToIterate = (Array.isArray(sortedActiveModeKeys) && sortedActiveModeKeys.length > 0)
                        ? sortedActiveModeKeys
                        : Object.keys(activeModeDetails || {});

  if (keysToIterate.length === 0) {
    return <Typography sx={{ p: 2, fontStyle: 'italic', textAlign: 'center' }}>No selected modes or data available to display deltas.</Typography>;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          sm: 'repeat(3, minmax(0, 1fr))',
          md: 'repeat(7, minmax(0, 1fr))',
        },
        gap: 2,
        width: '100%',
      }}
    >
        {keysToIterate.map((modeKey) => {
            const modeInfo = activeModeDetails[modeKey];
            if (!modeInfo) {
                return null;
            }

            const modeName = modeInfo.name || modeKey; // Fallback to key if name is missing
            const deltaValue = (deltas && deltas[modeKey] !== undefined) ? deltas[modeKey] : null;
            const formattedValue = formatDelta(deltaValue);
            const color = getColorForDelta(deltaValue);
            const IconComponent = modeIcons[modeKey] || modeIcons["DEFAULT"];

            return (
                    <Paper key={modeKey} elevation={1} sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 140, minWidth: 0 }}>
                        <IconComponent sx={{ fontSize: 40, mb: 1, color: modeInfo.color }} />
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
            );
        })}
    </Box>
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
