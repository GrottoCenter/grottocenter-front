import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';

const ButtonChoice = ({
  text = '',
  buttons, // Un seul array avec objets contenant label et onClick
  defaultColor = 'primary', // Couleur par défaut pour tous les boutons
  selectedColor = 'success', // Couleur du bouton sélectionné
  selectedIndex = null // Index du bouton sélectionné par défaut
}) => {
  const [selected, setSelected] = useState(selectedIndex);

  const handleButtonClick = (index, onClick) => {
    setSelected(index);
    if (onClick) {
      onClick();
    }
  };

  return (
    <Box sx={{ textAlign: 'center', mb: 2 }}>
      {text && (
        <Typography variant="h6" gutterBottom>
          {text}
        </Typography>
      )}

      <Box sx={{ mb: 2 }}>
        {buttons.map((button, index) => {
          const key = button.key || button.label || `btn-${index}`;
          return (
            <Button
              key={key}
              variant="contained"
              color={
                selected === index
                  ? button.selectedColor || selectedColor
                  : button.defaultColor || defaultColor
              }
              onClick={() => handleButtonClick(index, button.onClick)}
              sx={{ mr: 1 }}>
              {button.label}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
};

ButtonChoice.propTypes = {
  text: PropTypes.string,
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      defaultColor: PropTypes.string, // Couleur par défaut spécifique à ce bouton
      selectedColor: PropTypes.string // Couleur sélectionnée spécifique à ce bouton
    })
  ).isRequired,
  defaultColor: PropTypes.string, // Couleur par défaut globale
  selectedColor: PropTypes.string, // Couleur sélectionnée globale
  selectedIndex: PropTypes.number // Index du bouton sélectionné par défaut
};

export default ButtonChoice;
