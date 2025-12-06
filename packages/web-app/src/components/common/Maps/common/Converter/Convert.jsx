/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import proj4 from 'proj4';
import {groupBy} from 'ramda';
import Button from '@mui/material/Button';
import {styled} from '@mui/material/styles';
import Input from '@mui/material/Input';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import {unitsTab} from '../../../../../conf/ListGPSProj';
import Translate from '../../../Translate';
import getLocalizedCountryName from '../../../../../helpers/countryName';

const MainContainer = styled('div')({
});

const SubContainer = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.primary3Color,
    padding: '5px',
    margin: '5px',
    textAlign: 'center'
}));

const BottomContainer = styled('div')({
    padding: '5px',
    margin: '5px',
    textAlign: 'center'
});

const Element = styled('div')({
    display: 'table'
});

const SubElement = styled('div')({
    display: 'table-cell',
    verticalAlign: 'middle'
});

const StyledInput = styled(Input)(({ theme }) => ({
    background: theme.palette.backgroundButton,
    padding: '5px',
    margin: '5px',
    fontSize: 'small'
}));

const StyledSelect = styled(Select)(({ theme }) => ({
    background: theme.palette.backgroundButton
}));

const MenuItemGroup = styled(MenuItem)({
    fontSize: 'larger',
    fontWeight: 'bold'
});

const StyledMenuItem = styled(MenuItem)({
    fontSize: 'small',
    padding: '0 30px'
});

const ConvertButton = styled(Button)(({ theme }) => ({
    background: theme.palette.backgroundButton,
    color: theme.palette.text.primary,
    padding: '0 20px'
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
    background: theme.palette.divider,
    marginBottom: '10px'
}));

const StyledTitle = styled('h5')`
    font-weight: bold;
    margin-bottom: 5px;
`;

class Convert extends React.Component {
    static addZone(definition, zone) {
        const tmp = definition.split('+zone=');
        const tmp2 = tmp[1].substring(2);
        return `${tmp[0]}+zone=${zone} ${tmp2}`;
    }

    static removeSouth(definition) {
        const tmp = definition.split('+south');
        let res;
        if (tmp.length > 1) {
            res = tmp[0] + tmp[1];
        } else {
            [res] = tmp;
        }
        return res;
    }

    static getUTMZone(wgs84lng) {
        return wgs84lng >= 0 ? Math.floor((wgs84lng + 180) / 6) + 1 : Math.floor(wgs84lng / 6) + 31;
    }

    static getHemisphere(wgs84Lat) {
        return wgs84Lat >= 0 ? 'North' : 'South';
    }

    constructor(props) {
        super(props);
        this.state = {
            valueXInput: '',
            valueYInput: '',
            keyGPSInput: 'WGS84',
            keyGPSOutput: 'WGS84',
            xNameInput: '',
            xUnitInput: '',
            yNameInput: '',
            yUnitInput: '',
            xNameOutput: '',
            xUnitOutput: '',
            yNameOutput: '',
            yUnitOutput: '',
            valueXOutput: '',
            valueYOutput: '',
            utmInput: false,
            utmOutput: false,
            hemiInput: 'North',
            hemiOutput: 'North',
            zoneInput: 31,
            zoneOutput: 31,
            projectionsList: props.list
        };
    }

    componentDidMount() {
        const {keyGPSInput, keyGPSOutput} = this.state;
        const unitInput = this.getUnits(keyGPSInput);
        const unitOutput = this.getUnits(keyGPSOutput);

        if (unitInput && unitsTab[unitInput]) {
            this.setState({xNameInput: unitsTab[unitInput].xName});
            this.setState({xUnitInput: unitsTab[unitInput].xUnit});
            this.setState({yNameInput: unitsTab[unitInput].yName});
            this.setState({yUnitInput: unitsTab[unitInput].yUnit});
        }
        if (unitOutput && unitsTab[unitOutput]) {
            this.setState({xNameOutput: unitsTab[unitOutput].xName});
            this.setState({xUnitOutput: unitsTab[unitOutput].xUnit});
            this.setState({yNameOutput: unitsTab[unitOutput].yName});
            this.setState({yUnitOutput: unitsTab[unitOutput].yUnit});
        }
    }

    getDef(keyGps) {
        const {projectionsList} = this.state;
        for (let i = 0; i < projectionsList.length; i += 1) {
            if (projectionsList[i].code === keyGps) {
                return projectionsList[i].definition;
            }
        }
        return null;
    }

    getUnits(keyGps) {
        let units;
        const {projectionsList} = this.state;
        for (let i = 0; i < projectionsList.length; i += 1) {
            if (projectionsList[i].code === keyGps) {
                units = projectionsList[i].units;
                break;
            }
        }
        return units;
    }

    handleStateChange = (stateKey, newValue) => {
        this.setState({[stateKey]: newValue});
    };

    handleChangeGPSInput = event => {
        const units = this.getUnits(event.target.value);
        const unitConfig = unitsTab[units] || unitsTab.m;
        this.setState({
            keyGPSInput: event.target.value,
            xNameInput: unitConfig.xName,
            xUnitInput: unitConfig.xUnit,
            yNameInput: unitConfig.yName,
            yUnitInput: unitConfig.yUnit,
            utmInput: this.isUtm(event.target.value),
            valueXInput: '',
            valueYInput: '',
            valueXOutput: '',
            valueYOutput: '',
            zoneInput: 0,
            hemiInput: 'North',
            zoneOutput: 0,
            hemiOutput: 'North'
        });
    };

    handleChangeGPSOutput = event => {
        const units = this.getUnits(event.target.value);
        const unitConfig = unitsTab[units] || unitsTab.m;
        this.setState({
            keyGPSOutput: event.target.value,
            xNameOutput: unitConfig.xName,
            xUnitOutput: unitConfig.xUnit,
            yNameOutput: unitConfig.yName,
            yUnitOutput: unitConfig.yUnit,
            utmOutput: this.isUtm(event.target.value)
        }, () => {
            if (this.state.valueXInput && this.state.valueYInput) {
                this.handleConvert({preventDefault: () => {}});
            }
        });
    };

    buildUTMProjection = (definition, zone, hemisphere) => {
        let projection = Convert.addZone(definition, zone);
        projection = Convert.removeSouth(projection);
        if (hemisphere === 'South') {
            projection += ' +south';
        }
        return projection;
    };

    handleConvert = event => {
        event.preventDefault();

        const {
            keyGPSInput,
            keyGPSOutput,
            valueXInput,
            valueYInput,
            utmInput,
            zoneInput,
            hemiInput,
            utmOutput
        } = this.state;

        if (!valueXInput || !valueYInput) {
            return;
        }

        const inputUnits = this.getUnits(keyGPSInput);
        const outputUnits = this.getUnits(keyGPSOutput);
        
        let firstProjection = this.getDef(keyGPSInput);
        let secondProjection = this.getDef(keyGPSOutput);
        
        const xValue = inputUnits === 'degrees' ? valueYInput : valueXInput;
        const yValue = inputUnits === 'degrees' ? valueXInput : valueYInput;

        if (utmInput) {
            firstProjection = this.buildUTMProjection(firstProjection, zoneInput, hemiInput);
        }

        const newState = {};
        let wgs84Coords;

        if (utmOutput) {
            const wgs84Def = this.getDef('WGS84');
            const [lng, lat] = proj4(firstProjection, wgs84Def, [parseFloat(xValue), parseFloat(yValue)]);
            wgs84Coords = [lat, lng];
            const calculatedZone = Convert.getUTMZone(lng);
            const calculatedHemi = Convert.getHemisphere(lat);
            
            secondProjection = this.buildUTMProjection(secondProjection, calculatedZone, calculatedHemi);
            newState.zoneOutput = calculatedZone;
            newState.hemiOutput = calculatedHemi;
        } else {
            const wgs84Def = this.getDef('WGS84');
            const [lng, lat] = proj4(firstProjection, wgs84Def, [parseFloat(xValue), parseFloat(yValue)]);
            wgs84Coords = [lat, lng];
        }

        const [convertedX, convertedY] = proj4(firstProjection, secondProjection, [
            parseFloat(xValue),
            parseFloat(yValue)
        ]);

        if (outputUnits === 'degrees') {
            newState.valueXOutput = convertedY;
            newState.valueYOutput = convertedX;
        } else {
            newState.valueXOutput = convertedX;
            newState.valueYOutput = convertedY;
        }

        this.setState(newState);

        if (this.props.map && wgs84Coords) {
            this.props.map.setView(wgs84Coords, this.props.map.getZoom());
        }

        if (this.props.onConvert) {
            this.props.onConvert();
        }
    };

    isUtm(keyGps) {
        const {projectionsList} = this.state;
        for (let i = 0; i < projectionsList.length; i += 1) {
            if (projectionsList[i].code === keyGps) {
                return projectionsList[i].proj === 'utm';
            }
        }
        return null;
    }

    render() {
        const {formatMessage, intl} = this.props;
        const locale = intl?.locale || 'en';
        const {
            hemiInput,
            hemiOutput,
            keyGPSInput,
            keyGPSOutput,
            projectionsList,
            utmInput,
            utmOutput,
            valueXInput,
            valueYInput,
            valueXOutput,
            valueYOutput,
            xNameInput,
            xNameOutput,
            yNameInput,
            yNameOutput,
            xUnitInput,
            xUnitOutput,
            yUnitInput,
            yUnitOutput,
            zoneOutput
        } = this.state;
        // Recover all the coodinates system for options select
        const groupedProjections = groupBy(
            p => getLocalizedCountryName(p, formatMessage, locale, p.en_name) || formatMessage({id: 'World'}),
            projectionsList
        );
        const options = [];
        const worldLabel = formatMessage({id: 'World'});

        Object.entries(groupedProjections)
            .sort(([a], [b]) => a === worldLabel ? -1 : b === worldLabel ? 1 : a.localeCompare(b))
            .forEach(([countryName, projections]) => {
            options.push(
                <MenuItemGroup key={countryName} disabled>
                    {countryName}
                </MenuItemGroup>
            );
            projections.forEach(projection => {
                options.push(
                    <StyledMenuItem key={projection.code} value={projection.code}>
                        {projection.title}
                    </StyledMenuItem>
                );
            });
        });

        return (
            <MainContainer id="convert">
                {/* INPUT SECTION */}
                <SubContainer id="input">
                    <StyledTitle>
                        <Translate>Input</Translate>
                    </StyledTitle>
                    <StyledDivider/>

                    {/* COORDINATES SYSTEMS SECTION */}
                    <Element id="selectInput">
                        <SubElement>
                            <Translate>Coordinate system</Translate>
                            {' : '}
                        </SubElement>
                        <FormControl>
                            <StyledSelect
                                value={keyGPSInput}
                                onChange={this.handleChangeGPSInput}>
                                {options}
                            </StyledSelect>
                        </FormControl>
                    </Element>

                    {/* UTM SECTION HEMISPHERE AND ZONE INPUT */}
                    {utmInput && [
                        <div key="hemisphereInput" id="hemisphereInput">
                            <Translate>Hemisphere:</Translate>
                            <StyledSelect
                                value={hemiInput}
                                onChange={event =>
                                    this.handleStateChange('hemiInput', event.target.value)
                                }>
                                <StyledMenuItem value="North">
                                  <Translate>North</Translate>
                                </StyledMenuItem>
                                <StyledMenuItem value="South">
                                  <Translate>South</Translate>
                                </StyledMenuItem>
                            </StyledSelect>
                        </div>,
                        <div key="zoneInput" id="zoneInput">
                            <Translate>Zone:</Translate>
                            <StyledInput
                                type="number"
                                placeholder={formatMessage({id: '0'})}
                                onChange={event =>
                                    this.handleStateChange('zoneInput', event.target.value)
                                }
                            />
                        </div>
                    ]}

                    {/* COORDINATES INPUT SECTION */}
                    <div id="xInput">
                        {xNameInput}
                        {' : '}
                        <StyledInput
                            type="number"
                            value={valueXInput}
                            placeholder={formatMessage({id: '0'})}
                            onChange={event =>
                                this.handleStateChange('valueXInput', event.target.value)
                            }
                        />
                        {xUnitInput}
                    </div>

                    <div id="yInput">
                        {yNameInput}
                        {' : '}
                        <StyledInput
                            type="number"
                            value={valueYInput}
                            placeholder={formatMessage({id: '0'})}
                            style={{marginLeft: '5px'}}
                            onChange={event =>
                                this.handleStateChange('valueYInput', event.target.value)
                            }
                        />
                        {yUnitInput}
                    </div>

                    {/* BUTTON SECTION */}
                    <ConvertButton onClick={this.handleConvert}>
                        <Translate>Convert</Translate>
                    </ConvertButton>
                </SubContainer>

                {/* OUTPUT SECTION */}
                {!this.props.hideOutput && <SubContainer id="output">
                    <StyledTitle>
                        <Translate>Output</Translate>
                    </StyledTitle>
                    <StyledDivider/>

                    {/* COORDINATES SYSTEMS SECTION */}
                    <Element id="selectOutput">
                        <SubElement>
                            <Translate>Coordinate system</Translate>
                            {' : '}
                        </SubElement>
                        <FormControl>
                            <StyledSelect
                                value={keyGPSOutput}
                                onChange={this.handleChangeGPSOutput}>
                                {options}
                            </StyledSelect>
                        </FormControl>
                    </Element>

                    {/* UTM SECTION HEMISPHERE AND ZONE OUTPUT */}
                    {utmOutput && [
                        <div key="hemisphereOutput" id="hemisphereOutput">
                          <Translate>Hemisphere:</Translate>
                          <StyledSelect
                            value={hemiOutput}
                            disabled>
                            <StyledMenuItem value="North">
                              <Translate>North</Translate>
                            </StyledMenuItem>
                            <StyledMenuItem value="South">
                              <Translate>South</Translate>
                            </StyledMenuItem>
                          </StyledSelect>
                        </div>,
                        <div key="zoneOutput" id="zoneOutput">
                            <Translate>Zone:</Translate>
                            <StyledInput
                                type="number"
                                value={zoneOutput}
                                disabled
                            />
                        </div>
                    ]}

                    {/* COORDINATES OUTPUT SECTION */}
                    <div id="xOutput">
                        {xNameOutput}
                        {' : '}
                        <StyledInput type="number" value={valueXOutput} disabled/>
                        {xUnitOutput}
                    </div>

                    <div id="yOutput">
                        {yNameOutput}
                        {' : '}
                        <StyledInput
                            type="number"
                            value={valueYOutput}
                            style={{marginLeft: '2px'}}
                            disabled
                        />
                        {yUnitOutput}
                    </div>
                </SubContainer>}

                {/* BOTTOM SECTION */}
                <BottomContainer id="bottom">
          <span>
            <Translate
              id="Based on the library {proj4jsLink} and the project {proj4Link}, this converter uses the conversion constants from {spatialReferenceLink}."
              values={{
                proj4jsLink: <a key="proj4js" href="http://proj4js.org">Proj4js</a>,
                proj4Link: <a key="proj4" href="http://trac.osgeo.org/proj">Proj.4</a>,
                spatialReferenceLink: <a key="spatialref" href="http://spatialreference.org">Spatial Reference</a>
              }}
            />
          </span>
                </BottomContainer>
            </MainContainer>
        );
    }
}

Convert.propTypes = {
    formatMessage: PropTypes.func.isRequired,
    intl: PropTypes.shape({
        locale: PropTypes.string
    }).isRequired,
    list: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    map: PropTypes.object,
    hideOutput: PropTypes.bool,
    onConvert: PropTypes.func
};

export default Convert;
