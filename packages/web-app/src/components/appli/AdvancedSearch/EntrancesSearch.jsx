import React from 'react';
import PropTypes from 'prop-types';
import { pathOr } from 'ramda';
import { injectIntl } from 'react-intl';
import {
  FormControl,
  FormLabel,
  TextField,
  Switch,
  Typography,
  FormHelperText
} from '@mui/material';

import withStyles from '@mui/styles/withStyles';

import styles from './styles';
import Translate from '../../common/Translate';
import SearchBottomActionButtons from './SearchBottomActionButtons';
import SliderForm from './SliderForm';
import DivingTypesForm from './DivingTypesForm';
import SliderNonLinearForm from './SliderNonLinearForm';

const lengthMarks = [
  {
    value: 0,
    scaledValue: 0,
    label: '0'
  },
  {
    value: 20,
    scaledValue: 100,
    label: '100'
  },
  {
    value: 40,
    scaledValue: 1000,
    label: '1k'
  },
  {
    value: 60,
    scaledValue: 10000,
    label: '10k'
  },
  {
    value: 80,
    scaledValue: 100000,
    label: '100k'
  },
  {
    value: 100,
    scaledValue: 700000,
    label: '700k'
  }
];

const depthMarks = [
  {
    value: 0,
    scaledValue: 0,
    label: '0'
  },
  {
    value: 25,
    scaledValue: 50,
    label: '50'
  },
  {
    value: 50,
    scaledValue: 500,
    label: '500'
  },
  {
    value: 75,
    scaledValue: 1000,
    label: '1000'
  },
  {
    value: 100,
    scaledValue: 3000,
    label: '3000'
  }
];

class EntrancesSearch extends React.Component {
  // TODO: Handle the max of depth and length dynamically

  /*
    The state is created with particular key names because,
    these names are directly linked to
    the names of these properties in Elasticsearch.
   */
  constructor(props) {
    super(props);
    this.state = this.getInitialState();
    this.handleCheckedChange = this.handleCheckedChange.bind(this);
    this.handleValueChange = this.handleValueChange.bind(this);
    this.handleRangeChange = this.handleRangeChange.bind(this);
  }

  getInitialState() {
    const {
      aestheticismMinValue,
      aestheticismMaxValue,
      approachMinValue,
      approachMaxValue,
      caveDepthMinValue,
      caveDepthMaxValue,
      caveLengthMinValue,
      caveLengthMaxValue,
      cavingMinValue,
      cavingMaxValue
    } = this.props;

    return {
      'aestheticism-range': {
        isEditable: false,
        min: aestheticismMinValue,
        max: aestheticismMaxValue
      },
      'approach-range': {
        isEditable: false,
        min: approachMinValue,
        max: approachMaxValue
      },
      'cave depth-range': {
        isEditable: false,
        min: caveDepthMinValue,
        max: caveDepthMaxValue
      },
      'cave is diving-bool': '',
      'cave length-range': {
        isEditable: false,
        min: caveLengthMinValue,
        max: caveLengthMaxValue
      },
      'cave name': '',
      'caving-range': {
        isEditable: false,
        min: cavingMinValue,
        max: cavingMaxValue
      },
      city: '',
      country: '',
      county: '',
      'massif name': '',
      name: '',
      region: '',
      'underground type': '',
      'year_discovery-range': {
        isEditable: false,
        min: -1,
        max: new Date().getFullYear()
      },
      matchAllFields: true
    };
  }

  /**
   * This function set the state of the keyname property
   * to be the same value as the event of the slider.
   */
  handleCheckedChange = keyName => event => {
    const newState = {
      [keyName]: {
        ...this.state[keyName], // eslint-disable-line react/destructuring-assignment
        isEditable: event.target.checked
      }
    };
    this.setState(newState);
  };

  /**
   * keyName: String
   * event: Event
   * This function changes the state of the keyName property
   * with the value of the target event.
   */
  handleValueChange = (keyName, event) => {
    this.setState({
      [keyName]: pathOr(event, ['target', 'value'], event)
    });
  };

  /**
   * Set the state of the keyname property
   * to be the same value of the range.
   * If the values given are > to the minValueAuthorized
   * (same for < to maxValueAuthorized),
   * it set it to the min/maxValueAuthorized.
   */
  handleRangeChange = (
    keyName,
    values,
    minValueAuthorized,
    maxValueAuthorized
  ) => {
    const newState = {
      [keyName]: {
        ...this.state[keyName], // eslint-disable-line react/destructuring-assignment
        min: values[0] < minValueAuthorized ? minValueAuthorized : values[0],
        max: values[1] > maxValueAuthorized ? maxValueAuthorized : values[1]
      }
    };

    this.setState(newState);
  };

  handleBooleanChange = keyName => event => {
    this.setState({
      [keyName]: event.target.checked
    });
  };

  resetToInitialState = () => {
    this.setState(this.getInitialState());
  };

  render() {
    const {
      classes,
      resourceType,
      resetResults,
      startAdvancedsearch,
      aestheticismMinValue,
      aestheticismMaxValue,
      approachMinValue,
      approachMaxValue,
      caveDepthMinValue,
      caveDepthMaxValue,
      caveLengthMinValue,
      caveLengthMaxValue,
      cavingMinValue,
      cavingMaxValue,
      intl
    } = this.props;

    const {
      'aestheticism-range': aestheticismRange,
      'approach-range': approachRange,
      'cave depth-range': caveDepthRange,
      'cave is diving-bool': caveIsDiving,
      'cave length-range': caveLengthRange,
      'cave name': caveName,
      'caving-range': cavingRange,
      city,
      country,
      county,
      'massif name': massifName,
      name,
      region,
      matchAllFields
      // 'underground type': undergroundType,
      // 'year_discovery-range': yearOfDiscoveryRange,
    } = this.state;

    return (
      <form
        noValidate
        autoComplete="off"
        onSubmit={event => {
          event.preventDefault();
          startAdvancedsearch(this.state, resourceType);
        }}
        className={classes.formContainer}>
        <Typography variant="h6">
          <Translate>Entrance properties</Translate>
        </Typography>
        <div
          className={classes.formPartContainer}
          style={{ justifyContent: 'flex-start' }}>
          <TextField
            className={classes.formElement}
            label={intl.formatMessage({
              id: 'Entrance name'
            })}
            onChange={event => this.handleValueChange('name', event)}
            value={name}
          />
        </div>

        <fieldset className={classes.fieldset}>
          <legend className={classes.legend}>
            <Translate>Localization</Translate>
          </legend>

          <div className={classes.formPartContainer}>
            <TextField
              className={classes.formElement}
              label={intl.formatMessage({
                id: 'City'
              })}
              onChange={event => this.handleValueChange('city', event)}
              value={city}
            />

            <TextField
              className={classes.formElement}
              label={intl.formatMessage({
                id: 'County'
              })}
              onChange={event => this.handleValueChange('county', event)}
              value={county}
            />

            <TextField
              className={classes.formElement}
              label={intl.formatMessage({
                id: 'Region'
              })}
              onChange={event => this.handleValueChange('region', event)}
              value={region}
            />

            <TextField
              className={classes.formElement}
              label={intl.formatMessage({
                id: 'Country'
              })}
              onChange={event => this.handleValueChange('country', event)}
              value={country}
            />

            <TextField
              className={classes.formElement}
              label={intl.formatMessage({
                id: 'Massif name'
              })}
              onChange={event => this.handleValueChange('massif name', event)}
              value={massifName}
            />
          </div>
        </fieldset>

        <fieldset className={classes.fieldset}>
          <legend className={classes.legend}>
            <Translate>Rating criterias</Translate>
          </legend>
          <div className={classes.formPartContainer}>
            <SliderForm
              label={intl.formatMessage({
                id: 'Aesthetic'
              })}
              disabled={!aestheticismRange.isEditable}
              onDisable={this.handleCheckedChange('aestheticism-range')}
              min={aestheticismMinValue}
              max={aestheticismMaxValue}
              onChange={values => {
                this.handleRangeChange(
                  'aestheticism-range',
                  values,
                  aestheticismMinValue,
                  aestheticismMaxValue
                );
              }}
              value={[aestheticismRange.min, aestheticismRange.max]}
            />
            <SliderForm
              label={intl.formatMessage({
                id: 'Ease of move'
              })}
              disabled={!cavingRange.isEditable}
              onDisable={this.handleCheckedChange('caving-range')}
              min={cavingMinValue}
              max={cavingMaxValue}
              onChange={values => {
                this.handleRangeChange(
                  'caving-range',
                  values,
                  cavingMinValue,
                  cavingMaxValue
                );
              }}
              value={[cavingRange.min, cavingRange.max]}
            />
            <SliderForm
              label={intl.formatMessage({
                id: 'Ease of reach'
              })}
              disabled={!approachRange.isEditable}
              onDisable={this.handleCheckedChange('approach-range')}
              min={approachMinValue}
              max={approachMaxValue}
              onChange={values => {
                this.handleRangeChange(
                  'approach-range',
                  values,
                  approachMinValue,
                  approachMaxValue
                );
              }}
              value={[approachRange.min, approachRange.max]}
            />
          </div>
        </fieldset>

        <fieldset className={classes.fieldset}>
          <legend className={classes.legend}>
            <Translate>Network properties</Translate>
          </legend>

          <div className={classes.formPartContainer}>
            <TextField
              className={classes.formElement}
              label={intl.formatMessage({
                id: 'Network name'
              })}
              onChange={event => this.handleValueChange('cave name', event)}
              value={caveName}
            />

            <DivingTypesForm
              onChange={event =>
                this.handleValueChange('cave is diving-bool', event)
              }
              value={caveIsDiving}
            />
            <SliderNonLinearForm
              label={intl.formatMessage({
                id: 'Depth'
              })}
              helperText={intl.formatMessage({
                id: 'In meters'
              })}
              disabled={!caveDepthRange.isEditable}
              onDisable={this.handleCheckedChange('cave depth-range')}
              onChange={values => {
                this.handleRangeChange(
                  'cave depth-range',
                  values,
                  caveDepthMinValue,
                  caveDepthMaxValue
                );
              }}
              value={[caveDepthRange.min, caveDepthRange.max]}
              marks={depthMarks}
            />

            <SliderNonLinearForm
              label={intl.formatMessage({
                id: 'Length'
              })}
              helperText={intl.formatMessage({
                id: 'In meters'
              })}
              disabled={!caveLengthRange.isEditable}
              onDisable={this.handleCheckedChange('cave length-range')}
              onChange={values => {
                this.handleRangeChange(
                  'cave length-range',
                  values,
                  caveLengthMinValue,
                  caveLengthMaxValue
                );
              }}
              value={[caveLengthRange.min, caveLengthRange.max]}
              marks={lengthMarks}
            />
          </div>
        </fieldset>

        <div
          className={classes.formPartContainer}
          style={{ justifyContent: 'flex-start' }}>
          <FormControl>
            <FormLabel className={classes.formLabel}>
              <Translate>
                {matchAllFields
                  ? 'Matching all fields'
                  : 'Matching at least one field'}
              </Translate>
              <Switch
                checked={matchAllFields}
                onChange={this.handleBooleanChange('matchAllFields')}
                value={matchAllFields}
              />
            </FormLabel>
            <FormHelperText>
              <Translate>
                Specify if the search results must match all the fields you
                typed above (default is yes).
              </Translate>
            </FormHelperText>
          </FormControl>
        </div>

        <SearchBottomActionButtons
          resetResults={resetResults}
          resetParentState={this.resetToInitialState}
        />
      </form>
    );
  }
}

EntrancesSearch.propTypes = {
  classes: PropTypes.shape({
    formContainer: PropTypes.string,
    formPartContainer: PropTypes.string,
    formElement: PropTypes.string,
    fieldset: PropTypes.string,
    legend: PropTypes.string,
    formLabel: PropTypes.string
  }),
  startAdvancedsearch: PropTypes.func.isRequired,
  resetResults: PropTypes.func.isRequired,
  resourceType: PropTypes.string.isRequired,

  // Min / max values for form
  aestheticismMinValue: PropTypes.number,
  aestheticismMaxValue: PropTypes.number,
  approachMinValue: PropTypes.number,
  approachMaxValue: PropTypes.number,
  cavingMinValue: PropTypes.number,
  cavingMaxValue: PropTypes.number,

  caveDepthMinValue: PropTypes.number,
  caveDepthMaxValue: PropTypes.number,
  caveLengthMinValue: PropTypes.number,
  caveLengthMaxValue: PropTypes.number,

  intl: PropTypes.shape({ formatMessage: PropTypes.func }).isRequired
};

EntrancesSearch.defaultProps = {
  aestheticismMinValue: 0,
  aestheticismMaxValue: 10,
  approachMinValue: 0,
  approachMaxValue: 10,
  cavingMinValue: 0,
  cavingMaxValue: 10,

  caveDepthMinValue: 0,
  caveDepthMaxValue: 3000,
  caveLengthMinValue: 0,
  caveLengthMaxValue: 700000
};

export default injectIntl(withStyles(styles)(EntrancesSearch));
