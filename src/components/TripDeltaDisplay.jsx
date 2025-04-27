// src/components/TripDeltaDisplay.jsx - COMPLETE CODE with updated icons

import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Box, Typography, Paper } from '@mui/material';

// Import Icons
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'; // Drive, Carpool, Vanpool, Drop-off?
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'; // Bike
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk'; // Walk
import CommuteIcon from '@mui/icons-material/Commute'; // General Transit/Commute
import TramIcon from '@mui/icons-material/Tram'; // Light Rail specific
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus'; // Bus specific
import HailIcon from '@mui/icons-material/Hail'; // Drop-off? Or use Car icon?
import GroupsIcon from '@mui/icons-material/Groups'; // Carpool / Vanpool?
// import HomeWorkIcon from '@mui/icons-material/HomeWork'; // For Telework/Remote (if added)
// import CategoryIcon from '@mui/icons-material/Category'; // For 'Other' or fallback (if added)
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // Fallback

// --- Icon Mapping ---
// **** UPDATE THIS MAP ****
// Ensure keys here EXACTLY match the keys in your config.js MODES object
const modeIcons = {
    "Drive": DirectionsCarIcon,
    "Light Rail": TramIcon,         // Added specific icon
    "Bus": DirectionsBusIcon,       // Added specific icon
    "Drop-off": HailIcon,         // Added specific icon (or use DirectionsCarIcon)
    "Walk": DirectionsWalkIcon,
    "Carpool": GroupsIcon,        // Added specific icon (or use DirectionsCarIcon)
    "Vanpool": GroupsIcon,        // Added specific icon (or use DirectionsCarIcon) - Consider different one?
    "Bike": DirectionsBikeIcon,
    // "Telework": HomeWorkIcon,    // Example if added
    // "Other": CategoryIcon,       // Example if added
};

// --- Helper Functions ---
const formatDelta = (delta) => {
    // Handle null/undefined explicitly as well as NaN
    if (delta === null || delta === undefined || typeof delta !== 'number' || isNaN(delta)) {
        return '-'; // Placeholder for missing/invalid data
    }
    const roundedDelta = Math.round(delta);
    // Handle zero separately if desired, otherwise it shows as "0"
    if (roundedDelta === 0) return "0";
    return roundedDelta > 0 ? `+${roundedDelta}` : `${roundedDelta}`; // Add '+' sign for positive
};

const getColorForDelta = (delta) => {
    // Handle null/undefined explicitly
    if (delta === null || delta === undefined || typeof delta !== 'number' || isNaN(delta) || delta === 0) {
        return 'text.secondary'; // Neutral color
    }
    return delta > 0 ? 'success.main' : 'error.main'; // Green for positive, Red for negative
};

// --- Component Definition ---
function TripDeltaDisplay({ deltas, modes }) {

    const validDeltas = (typeof deltas === 'object' && deltas !== null) ? deltas : {};
    const validModes = (typeof modes === 'object' && modes !== null) ? modes : {};
    // Now this gets the correct keys: ["Drive", "Light Rail", ...]
    const modeKeys = Object.keys(validModes);

    if (modeKeys.length === 0) {
        return <Typography sx={{ p: 2, fontStyle: 'italic' }}>No modes configured.</Typography>;
    }

    return (
        <Grid container spacing={2} alignItems="stretch">
            {modeKeys.map((modeKey) => {
                // Get the display name from the modes object
                const modeName = validModes[modeKey] || modeKey; // Fallback to key if name missing
                const deltaValue = validDeltas[modeKey];
                const formattedValue = formatDelta(deltaValue);
                const color = getColorForDelta(deltaValue);
                // Lookup icon using the correct modeKey
                const IconComponent = modeIcons[modeKey] || HelpOutlineIcon; // Use fallback if key not in map

                return (
                    // Adjust grid sizing based on number of modes if needed
                    <Grid item xs={6} sm={4} md={3} lg={1.5} key={modeKey}> {/* Example: 8 modes fit well on lg */}
                        <Paper elevation={1} sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 140 }}> {/* Added minHeight */}
                            <IconComponent sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
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

TripDeltaDisplay.propTypes = {
    /** Object containing the calculated delta values for each mode (e.g., { Drive: -50, Bike: 20 }) */
    deltas: PropTypes.object,
    /** Object mapping mode keys to their display names (e.g., { Drive: 'Drive Alone', Bike: 'Bicycle' }) */
    modes: PropTypes.object.isRequired,
};

TripDeltaDisplay.defaultProps = {
    deltas: {},
};

export default TripDeltaDisplay;