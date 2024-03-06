import React from 'react';
import { useIntl } from 'react-intl';
import withStyles from '@mui/styles/withStyles';
import {
  Box,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  List,
  ListItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DataQualityComputeTable from './DataQualityComputeTable';

const ImageBox = withStyles(
  () => ({
    root: {
      padding: '5px 10px'
    }
  }),
  { withTheme: true }
)(Box);

const StyledListItem = withStyles({
  root: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    margin: '0px'
  }
})(ListItem);

const DataQualityComputeDetails = () => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  return (
    <Box>
      <Accordion
        style={{
          backgroundColor: theme.palette.secondary.veryLight,
          margin: 30
        }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ImageBox>
            <HelpOutlineIcon
              id="details"
              style={{
                width: '35px',
                height: '35px',
                color: theme.palette.secondary.main
              }}
            />
          </ImageBox>
          {formatMessage({
            id: 'The quality of the data is calculated from the information available on the cave, the number of people who provided information and the date of the last contributions. This allows us to build a value between 3 and 100.'
          })}
        </AccordionSummary>
        <AccordionDetails>
          {/* General details */}
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '0px 10px',
              width: '100%'
            }}>
            <Box>
              {formatMessage({
                id: 'The chosen color code is as follows:'
              })}
              <List>
                {/* Insufficient quality */}
                <StyledListItem>
                  <Typography
                    style={{
                      color: theme.palette.errorColor,
                      fontWeight: '600',
                      minWidth: 'fit-content'
                    }}>
                    -{' '}
                    {formatMessage({
                      id: 'index < 40'
                    })}
                    &nbsp;
                  </Typography>
                  {formatMessage({
                    id: 'the quality is insufficient an effort must be made to provide quality information.'
                  })}
                </StyledListItem>

                {/* Satisfactory quality */}
                <StyledListItem>
                  <Typography
                    style={{
                      color: theme.palette.secondary.main,
                      fontWeight: '600'
                    }}>
                    -{' '}
                    {formatMessage({
                      id: '40 < index < 70'
                    })}
                    &nbsp;
                  </Typography>
                  {formatMessage({
                    id: 'the quality of the data is satisfactory but it can be improved.'
                  })}
                </StyledListItem>

                {/* High quality */}
                <StyledListItem>
                  <Typography
                    style={{
                      color: theme.palette.successColor,
                      fontWeight: '600'
                    }}>
                    -{' '}
                    {formatMessage({
                      id: 'index > 70'
                    })}
                    &nbsp;
                  </Typography>
                  {formatMessage({
                    id: 'the data provided is of high quality, a verification would guarantee the quality level of this data.'
                  })}
                </StyledListItem>
              </List>
            </Box>

            {/* Table */}
            <Box
              style={{
                width: '100%',
                overflowX: 'scroll'
              }}>
              <DataQualityComputeTable />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default DataQualityComputeDetails;
