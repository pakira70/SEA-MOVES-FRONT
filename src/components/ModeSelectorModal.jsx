// src/components/ModeSelectorModal.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox,
    FormControlLabel, FormGroup, TextField, Box, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
// Prop types (can share from ModelSetupPage or redefine)
const availableModeShape = PropTypes.shape({
    key: PropTypes.string.isRequired,
    defaultName: PropTypes.string.isRequired,
    defaultColor: PropTypes.string.isRequired,
    flags: PropTypes.object.isRequired,
    isDefaultActive: PropTypes.bool.isRequired,
});

function ModeSelectorModal({ availableModes, currentSelection, onClose, onSave }) {
    // Local state to manage selections within the modal without affecting App state until save
    const [modalSelection, setModalSelection] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Initialize modal state when component mounts or currentSelection changes
    useEffect(() => {
        setModalSelection({ ...currentSelection });
    }, [currentSelection]); // Sync when the prop changes (e.g., opening modal again)

    const handleCheckboxChange = (event) => {
        setModalSelection({
            ...modalSelection,
            [event.target.name]: event.target.checked,
        });
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value.toLowerCase());
    };

    const handleSaveChanges = () => {
        onSave(modalSelection); // Pass the modal's final selection state up
    };

    // Filter modes based on search term
    const filteredModes = availableModes.filter(mode =>
        mode.defaultName.toLowerCase().includes(searchTerm) ||
        mode.key.toLowerCase().includes(searchTerm)
    );

    // Group modes (Example - adjust categories as needed)
    const groupedModes = filteredModes.reduce((acc, mode) => {
        let category = 'Other Modes'; // Default category
        if (['DRIVE', 'CARPOOL'].includes(mode.key)) category = 'Private Vehicle';
        else if (['WALK', 'BIKE'].includes(mode.key)) category = 'Active Transport';
        else if (['BUS', 'LRT', 'RAIL'].includes(mode.key)) category = 'Public Transit';
        else if (['OTHER_1', 'OTHER_2'].includes(mode.key)) category = 'Custom Slots';

        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(mode);
        return acc;
    }, {});

    const categoryOrder = ['Private Vehicle', 'Active Transport', 'Public Transit', 'Custom Slots', 'Other Modes']; // Define order

    return (
        <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Select Active Transportation Modes</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="Search modes..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: <SearchIcon position="start" sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                    />
                </Box>
                <FormGroup>
                    {categoryOrder.map(category => (
                        groupedModes[category] && (
                            <Box key={category} sx={{ mb: 2 }}>
                                <Typography variant="overline" display="block" gutterBottom sx={{ color: 'text.secondary' }}>
                                    {category}
                                </Typography>
                                <List dense disablePadding>
                                    {groupedModes[category].map((mode) => (
                                        <ListItem key={mode.key} disablePadding>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={modalSelection[mode.key] || false}
                                                        onChange={handleCheckboxChange}
                                                        name={mode.key}
                                                        size="small"
                                                        sx={{ py: 0.5 }}
                                                    />
                                                }
                                                label={
                                                     <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: mode.defaultColor, mr: 1, border: '1px solid rgba(0,0,0,0.2)' }} />
                                                        {mode.defaultName}
                                                        {['OTHER_1', 'OTHER_2'].includes(mode.key) && (
                                                             <Tooltip title="Affects mode share only. Does not impact parking, cost, or emissions calculations.">
                                                                <InfoOutlinedIcon sx={{ fontSize: '1rem', ml: 0.5, color: 'action.active' }}/>
                                                             </Tooltip>
                                                        )}
                                                    </Box>
                                                }
                                                sx={{ width: '100%', ml: 0 }} // Adjust label styling
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                {category !== categoryOrder[categoryOrder.length-1] && <Divider sx={{ my: 1 }} />} {/* Divider between categories */}
                            </Box>
                        )
                    ))}
                </FormGroup>
                 {filteredModes.length === 0 && searchTerm && (
                    <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 2 }}>
                        No modes match your search.
                    </Typography>
                 )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSaveChanges} variant="contained">Save Selections</Button>
            </DialogActions>
        </Dialog>
    );
}

ModeSelectorModal.propTypes = {
    availableModes: PropTypes.arrayOf(availableModeShape).isRequired,
    currentSelection: PropTypes.object.isRequired, // { key: boolean }
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired, // Func(newSelectedKeys)
};

export default ModeSelectorModal;