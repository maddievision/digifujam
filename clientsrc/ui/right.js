const React = require('react');
const DFPiano = require("./pianoArea");
const DF = require("../DFCommon");
const DFApp = require("../app");
const DFUtils = require("../util");
const DFSignIn = require("./DFSignIn");
const DFReactUtils = require("./DFReactUtils");
const DFAdminControls = require("./adminControls");
const UIUser = require("./UIUser");

const gModifierKeyTracker = new DFUtils.ModifierKeyTracker();

let gStateChangeHandler = null;

const GetHomepage = () => {
    const st = window.localStorage.getItem("DFHomepage");
    if (st) return st;
    return window.location.origin;
};

const htmlEncode = (str) => {
    let p = document.createElement("p");
    p.textContent = str;
    return p.innerHTML;
};


const getTimeSpanInfo = (ms) => {
    //const Sign = Math.sign(ms);
    //ms = Math.abs(ms);
    if (ms < 0) ms = 0;
    const TotalSeconds = Math.floor(ms / 1000);
    const TotalMinutes = Math.floor(ms / 60000);
    const TotalHours = Math.floor(ms / (60000 * 60));
    const TotalDays = Math.floor(ms / (60000 * 60 * 24));
    const SecondsPart = TotalSeconds % 60;
    const MinutesPart = TotalMinutes % 60;
    const HoursPart = TotalHours % 24;
    let ShortString = `${TotalHours}h ${MinutesPart}m ${SecondsPart}s`;
    if (!TotalHours && !!MinutesPart) {
        ShortString = `${MinutesPart}m ${SecondsPart}s`;
    } else if (!TotalHours && !MinutesPart) {
        ShortString = `${SecondsPart}s`;
    }

    let LongString = `${TotalDays} days ${HoursPart} hours ${MinutesPart} minutes ${SecondsPart} seconds`;
    if (!TotalDays) {
        LongString = `${HoursPart} hours ${MinutesPart} minutes ${SecondsPart} seconds`;
        if (!HoursPart) {
            LongString = `${MinutesPart} minutes ${SecondsPart} seconds`;
            if (!MinutesPart) {
                LongString = `${SecondsPart} seconds`;
            }
        }
    }

    return {
        TotalSeconds,
        TotalMinutes,
        TotalHours,
        TotalDays,
        SecondsPart,
        MinutesPart,
        HoursPart,
        ShortString,
        LongString,
    };
};

class InstTextParam extends React.Component {
    constructor(props) {
        super(props);
        this.inpID = "textParam_" + this.props.instrument.instrumentID + "_" + this.props.param.paramID;
        this.renderedValue = "";
    }
    onChange = (e) => {
        let val = e.target.value;
        this.renderedValue = val;
        this.props.app.SetInstrumentParam(this.props.instrument, this.props.param, val);
        gStateChangeHandler.OnStateChange();
    }
    componentDidMount() {
        // set initial values.
        let val = this.props.param.rawValue;
        $("#" + this.inpID).val(val);
        this.renderedValue = val;
    }
    render() {
        if (this.renderedValue != this.props.param.rawValue) {
            //has been externally modified. update ui.
            let val = this.props.param.rawValue;
            this.renderedValue = val;
            $("#" + this.inpID).val(val);
        }

        return (
            <li className={this.props.param.cssClassName}>
                <input readOnly={this.props.observerMode} id={this.inpID} type="text" maxLength={this.props.param.maxTextLength} onChange={this.onChange} />
                <label>{this.props.param.name}</label>
            </li>
        );
    }
}


// int parameter, but rendered as buttons using enum titles
// props.instrument
class InstButtonsParam extends React.Component {
    constructor(props) {
        super(props);
        this.inputID = "buttonsparam_" + this.props.instrument.instrumentID + "_" + this.props.param.paramID;
        this.renderedValue = 0;
    }
    onClickButton = (val) => {
        if (this.props.observerMode) return;
        this.props.app.SetInstrumentParam(this.props.instrument, this.props.param, val);
        gStateChangeHandler.OnStateChange();
    };
    render() {
        const buttons = (this.props.param.enumNames.map((e, val) => (
            <button className={"buttonParam " + ((this.props.param.rawValue == val) ? "active" : "")} key={val} onClick={() => this.onClickButton(val)}>{e}</button>
        )));

        return (
            <li className={"buttonsParam " + this.props.param.cssClassName}>
                {buttons}
                <label>{this.props.param.name}</label>
            </li>
        );
    }
}



// int parameter, but rendered as buttons using enum titles
// props.instrument
class InstDropdownParam extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            listShown: false
        };
    }
    onClickShown = () => {
        this.setState({ listShown: !this.state.listShown });
    }
    onClickButton = (val) => {
        if (this.props.observerMode) return;
        this.props.app.SetInstrumentParam(this.props.instrument, this.props.param, val);
        gStateChangeHandler.OnStateChange();
    };
    render() {
        const buttons = (this.props.param.enumNames.map((e, val) => (
            <li className={"item " + ((this.props.param.rawValue == val) ? "active" : "")} key={val} onClick={() => this.onClickButton(val)}>{e}</li>
        )));

        return (
            <li className={"dropdownParam " + this.props.param.cssClassName}>
                <div className="mainButton" onClick={this.onClickShown}>
                    <span className="arrow">{DF.getArrowText(this.state.listShown)}</span>
                    <span className="currentValue">{this.props.param.enumNames[this.props.param.rawValue]}</span>
                    <label>{this.props.param.name}</label>
                </div>
                {this.state.listShown && (
                    <ul className="dropdown">
                        {buttons}
                    </ul>
                )}
            </li>
        );
    }
}








// CHECKBOX instrument
// props.instrument
class InstCbxParam extends React.Component {
    onClick = () => {
        if (this.props.observerMode) return;
        let val = !!this.props.param.rawValue;
        this.props.app.SetInstrumentParam(this.props.instrument, this.props.param, !val);
        gStateChangeHandler.OnStateChange();
    }
    render() {
        let val = !!this.props.param.rawValue;
        let className = "cbxparam " + (val ? "on " : "off ") + this.props.param.cssClassName;

        return (
            <li className={className}>
                <button onClick={this.onClick}>{this.props.param.name}</button>
            </li>
        );
    }
}






// props.instrument
class InstIntParam extends React.Component {
    constructor(props) {
        super(props);
        this.valueTextID = "val_" + this.props.instrument.instrumentID + "_" + this.props.param.paramID;
        this.sliderID = "slider_" + this.props.instrument.instrumentID + "_" + this.props.param.paramID;
        this.renderedValue = -420.69;
    }
    setCaption() {
        let cap = null;
        const p = this.props.param;
        if (p.enumNames) {
            cap = p.enumNames[this.props.param.rawValue];
        } else {
            cap = this.props.param.rawValue;
        }
        $("#" + this.valueTextID).text(cap);
    }
    onChange = (e) => {
        //this.setState(this.state);
        let val = e.target.value;
        this.renderedValue = val;
        this.props.app.SetInstrumentParam(this.props.instrument, this.props.param, val);
        this.setCaption();
        gStateChangeHandler.OnStateChange();
    }
    componentDidMount() {
        // set initial values.
        let val = this.props.param.rawValue;
        $("#" + this.sliderID).val(val);
        this.setCaption();
        this.renderedValue = val;
        DFUtils.stylizeRangeInput(this.sliderID, {
            bgNegColorSpec: "#044",
            negColorSpec: "#044",
            posColorSpec: "#044",
            bgPosColorSpec: "#044",
            zeroVal: 0,
        });
    }
    render() {
        if (this.renderedValue != this.props.param.rawValue) {
            //has been externally modified. update ui.
            let val = this.props.param.rawValue;
            this.renderedValue = val;
            $("#" + this.sliderID).val(val);
            this.setCaption();
        }

        return (
            <li className={this.props.param.cssClassName}>
                <input disabled={this.props.observerMode} id={this.sliderID} className="intParam" type="range" min={this.props.param.minValue} max={this.props.param.maxValue} onChange={this.onChange}
                //value={this.props.param.rawValue} <-- setting values like this causes massive slowness
                />
                <label>{this.props.param.name}: <span id={this.valueTextID}></span></label>
            </li>
        );
    }
}

// <ParamMappingBox app={this.props.app} instrument={this.props.instrument} param={this.props.param} observerMode></ParamMappingBox>
class ParamMappingBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLearning: false,
        };
    }

    clickMidiLearn = () => {
        this.props.app.midi.learnMIDICC(cc => {
            if (cc < 0) return false;
            if (cc > 31) return false;
            // set up the mapping.
            //console.log(`setting up mapping for MIDI CC ${cc}`);
            this.props.app.createParamMappingFromSrcVal(this.props.param, cc);
            this.setState({ isLearning: false });
            gStateChangeHandler.OnStateChange();
            return true;
        });
        this.setState({ isLearning: true });
    }
    clickCancelLearning = () => {
        this.setState({ isLearning: false });
    };
    clickClearMapping = () => {
        //console.log(`clearing mapping.`);
        this.props.app.removeParamMapping(this.props.param);
        gStateChangeHandler.OnStateChange();
    }
    clickMacro = (macroIndex) => {
        this.props.app.createParamMappingFromMacro(this.props.param, macroIndex);
        this.setState({ isLearning: false });
        gStateChangeHandler.OnStateChange();
        return true;
    }
    render() {
        // is the param already mapped?
        const mappingSpec = this.props.instrument.getParamMappingSpec(this.props.param);
        const allowMacros = this.props.instrument.hasMacros();
        const createMappingBtns = !this.state.isLearning && !mappingSpec && (
            <div>
                Map to
                <button onClick={this.clickMidiLearn}>MIDI learn</button>
                {(!this.props.param.isMacro || this.props.param.macroIdx != 0) && allowMacros && <button onClick={() => this.clickMacro(0)}>{this.props.instrument.getMacroDisplayName(0)}</button>}
                {(!this.props.param.isMacro || this.props.param.macroIdx != 1) && allowMacros && <button onClick={() => this.clickMacro(1)}>{this.props.instrument.getMacroDisplayName(1)}</button>}
                {(!this.props.param.isMacro || this.props.param.macroIdx != 2) && allowMacros && <button onClick={() => this.clickMacro(2)}>{this.props.instrument.getMacroDisplayName(2)}</button>}
                {(!this.props.param.isMacro || this.props.param.macroIdx != 3) && allowMacros && <button onClick={() => this.clickMacro(3)}>{this.props.instrument.getMacroDisplayName(3)}</button>}
            </div>
        );
        const learningIndicator = this.state.isLearning && (
            <div className="learningIndicator">
                Listening for MIDI CC changes...
                <button onClick={this.clickCancelLearning}>Cancel</button>
            </div>
        );

        const effectiveRange = mappingSpec && this.props.instrument.getEffectiveMappingRange(mappingSpec);

        const activeMappingBody = !!mappingSpec && (
            <div>
                Mapped to {this.props.instrument.getMappingSrcDisplayName(mappingSpec)}
                <button onClick={this.clickClearMapping}>Clear</button>
                <ul>
                    <InstFloatParam app={this.props.app} instrument={this.props.instrument} observerMode={this.props.observerMode} param={mappingSpec.mappingRange}></InstFloatParam>
                </ul>
                Effective range: {effectiveRange[0].toFixed(3)} to {effectiveRange[1].toFixed(3)}
            </div>
        );

        return (
            <div className="paramMappingBox">
                {createMappingBtns}
                {learningIndicator}
                {activeMappingBody}
            </div>
        );
    };
}


// props.instrument
class InstFloatParam extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isExpanded: false,
            inputTextValue: this.props.param.rawValue.toFixed(4),
        };
        this.valueTextInputID = "i_" + this.props.instrument.instrumentID + "_" + this.props.param.paramID;
        this.valueTextDivID = "idiv_" + this.props.instrument.instrumentID + "_" + this.props.param.paramID;
        this.valueTextID = "val_" + this.props.instrument.instrumentID + "_" + this.props.param.paramID;
        this.sliderID = "slider_" + this.props.instrument.instrumentID + "_" + this.props.param.paramID;
        this.renderedValue = -420.69;
    }
    onChange = (e) => {
        const p = this.props.param;
        let realVal = p.foreignToNativeValue(e.target.value, 0, DF.ClientSettings.InstrumentFloatParamDiscreteValues);

        this.renderedValue = realVal;
        this.props.app.SetInstrumentParam(this.props.instrument, this.props.param, realVal);
        this.setCaption(this.props.param.rawValue);
        this.setInputTextVal(p.rawValue);
        //this.setState(this.state);
        gStateChangeHandler.OnStateChange();
    }
    componentDidMount() {
        // set initial values.
        const p = this.props.param;
        this.renderedValue = p.rawValue;
        this.setSliderVal(p.rawValue);
        this.setCaption(p.rawValue);
        this.setInputTextVal(p.rawValue);
        if (p.cssClassName.includes("modAmtParam")) {
            DFUtils.stylizeRangeInput(this.sliderID, {
                bgNegColorSpec: "#444",
                negColorSpec: "#66c",
                posColorSpec: "#66c",
                bgPosColorSpec: "#444",
                zeroVal: this._realValToSliderVal(0),
            });
        } else {
            DFUtils.stylizeRangeInput(this.sliderID, {
                bgNegColorSpec: "#044",
                negColorSpec: "#088",
                posColorSpec: "#088",
                bgPosColorSpec: "#044",
                zeroVal: this._realValToSliderVal(0),
            });
        }
    }

    _realValToSliderVal(rv) {
        const p = this.props.param;
        return p.nativeToForeignValue(rv, 0, DF.ClientSettings.InstrumentFloatParamDiscreteValues);
    }

    setInputTextVal(val) {
        this.setState({ inputTextValue: this.props.param.rawValue.toFixed(4) });
        //$("#" + this.valueTextInputID).val(this.props.param.rawValue.toFixed(4));
    }
    setCaption(val) {
        $("#" + this.valueTextID).text(this.props.param.rawValue.toFixed(3));
    }
    setSliderVal(val) {
        const p = this.props.param;
        let currentSliderValue = this._realValToSliderVal(val);
        $("#" + this.sliderID).val(currentSliderValue);
        $("#" + this.sliderID).trigger("change");
    }

    toggleShowTxt = () => {
        if (this.props.observerMode) return;

        if (!this.state.isExpanded) {
            let q = $("#" + this.valueTextInputID);
            q.focus();
            q.select();
        }

        this.setState({ isExpanded: !this.state.isExpanded });
    }

    onChangeValInput = (e) => {
        if (this.props.observerMode) return;
        this.setState({ inputTextValue: e.target.value });
    }

    handleTextInputKeyDown = (e) => {
        if (this.props.observerMode) return;
        if (e.key != 'Enter') return;
        this.setState(this.state);
        let realVal = parseFloat(e.target.value);
        this.props.app.SetInstrumentParam(this.props.instrument, this.props.param, realVal);

        this.setCaption(realVal);
        this.setSliderVal(realVal);
    }

    onClickSlider = (e) => {
        if (this.props.observerMode) return;
        let a = 0;
        if (gModifierKeyTracker.CtrlKey) {
            let realVal = this.props.app.roomState.GetDefaultValueForParam(this.props.instrument, this.props.param);

            this.setState(this.state);
            this.renderedValue = realVal;
            this.props.app.SetInstrumentParam(this.props.instrument, this.props.param, realVal);
            this.setCaption(realVal);
            this.setInputTextVal(realVal);
            this.setSliderVal(realVal);
        }
    };

    onDoubleClickSlider = (e) => {
        if (this.props.observerMode) return;
        let realVal = this.props.app.roomState.GetDefaultValueForParam(this.props.instrument, this.props.param);

        this.setState(this.state);
        this.renderedValue = realVal;
        this.props.app.SetInstrumentParam(this.props.instrument, this.props.param, realVal);
        this.setCaption(realVal);
        this.setInputTextVal(realVal);
        this.setSliderVal(realVal);
    };

    GetParamDisplayName() {
        return this.props.instrument.getParamDisplayName(this.props.param);
    }

    onMacroNameTextChanged = (txt) => {
        this.props.app.setMacroDisplayName(this.props.param.macroIdx, txt);
        this.setState({});
    }

    render() {
        if (this.renderedValue != this.props.param.rawValue) {
            //has been externally modified. update ui.
            let val = this.props.param.rawValue;
            this.renderedValue = val;
            this.setSliderVal(val);//$("#" + this.sliderID).val(val);
            this.setCaption(val);
        }

        const mappingSpec = this.props.instrument.getParamMappingSpec(this.props.param);
        let cssclass = "floatParam ";
        if (!!mappingSpec) cssclass += "hasMapping ";
        if (this.state.isExpanded) cssclass += "expanded ";

        let macroMappingList = null;
        if (/*this.state.isExpanded &&*/ this.props.param.isMacro) {
            const mappedParams = this.props.instrument.getMappingSpecsForMacro(this.props.param.macroIdx);
            macroMappingList = (<ul className="macroMappingList">
                {mappedParams.map(spec => {
                    const effectiveRange = this.props.instrument.getEffectiveMappingRange(spec);
                    return (
                        <li key={spec.param.paramID}>
                            → {this.props.instrument.getParamDisplayName(spec.param)} ({effectiveRange[0].toFixed(2)} to {effectiveRange[1].toFixed(2)})
                            ↠ <div className="mappedLiveValue">{spec.param.currentValue.toFixed(2)}</div>
                        </li>
                    )
                }
                )}
            </ul>);
        }

        return (
            <li className={cssclass + this.props.param.cssClassName}>
                <input id={this.sliderID} disabled={this.props.observerMode} className="floatParam" type="range" onClick={this.onClickSlider}
                    onDoubleClick={this.onDoubleClickSlider} min={0} max={DF.ClientSettings.InstrumentFloatParamDiscreteValues}
                    onChange={this.onChange}
                    ref={i => { this.sliderRef = i; }}
                //value={Math.trunc(rawValue)} <-- setting values like this causes massive slowness
                />
                <label onClick={this.toggleShowTxt}>
                    {this.GetParamDisplayName()}:
                    <div className="paramValueLabel">
                        <span id={this.valueTextID}></span>
                        {mappingSpec && (
                            <div className="mappedLiveValue">{this.props.param.currentValue.toFixed(2)}</div>
                        )}
                    </div>
                </label>
                {macroMappingList}
                { this.state.isExpanded && <div id={this.valueTextDivID}>
                    <input type="text" id={this.valueTextInputID} readOnly={this.props.observerMode} value={this.state.inputTextValue} onChange={this.onChangeValInput} onKeyDown={this.handleTextInputKeyDown} />
                    <label>Value</label>
                    {this.props.param.isMacro &&
                        <div className="macroNameInput">
                            <DFReactUtils.TextInputFieldExternalState onChange={this.onMacroNameTextChanged} value={this.props.instrument.getMacroDisplayName(this.props.param.macroIdx)}></DFReactUtils.TextInputFieldExternalState>
                            <label>Macro name</label>
                        </div>
                    }
                    {!this.props.observerMode && this.props.param.supportsMapping &&
                        <ParamMappingBox app={this.props.app} instrument={this.props.instrument} param={this.props.param} observerMode={this.props.observerMode}></ParamMappingBox>
                    }
                </div>
                }
            </li>
        );
    }
}






class InstrumentPreset extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showingOverwriteConfirmation: false,
            showingDeleteConfirmation: false,
        };
    }
    onClickLoad = () => {
        this.props.app.loadPatchObj(this.props.presetObj, true);
        gStateChangeHandler.OnStateChange();
    }
    onClickOverwrite = () => {
        this.props.app.saveOverwriteExistingPreset(this.props.presetObj.presetID);
        this.setState({ showingOverwriteConfirmation: false });
    }
    onBeginOverwrite = () => {
        this.setState({ showingOverwriteConfirmation: true });
    };
    onCancelOverwrite = () => {
        this.setState({ showingOverwriteConfirmation: false });
    }

    onClickDelete = () => {
        this.props.app.deletePreset(this.props.presetObj);
        this.setState({ showingDeleteConfirmation: false });
    }
    onBeginDelete = () => {
        this.setState({ showingDeleteConfirmation: true });
    }
    onCancelDelete = () => {
        this.setState({ showingDeleteConfirmation: false });
    }


    render() {
        const canWrite = !this.props.observerMode && (!this.props.presetObj.isReadOnly || this.props.app.myUser.IsAdmin());

        let dt = this.props.presetObj.savedDate;
        if (dt) {
            dt = new Date(dt);
        }
        let tags = null;
        if (this.props.presetObj.tags && this.props.presetObj.tags.length > 0) {
            tags = this.props.presetObj.tags;
        }
        let description = null;
        if (this.props.presetObj.description && this.props.presetObj.description.length > 0) {
            description = this.props.presetObj.description;
        }
        return (
            <li key={this.props.presetObj.patchName}>
                <div className="buttonContainer">
                    {!this.props.observerMode && <button onClick={() => this.onClickLoad()}>📂Load</button>}
                    {canWrite && <button onClick={this.onBeginOverwrite}>💾Save</button>}
                    {canWrite && <button onClick={this.onBeginDelete}>🗑Delete</button>}
                </div>
                <span className="presetName">{this.props.presetObj.patchName}</span>
                {
                    description &&
                    <span className="description">{description}</span>
                }
                <div className="authorAndDateBox">
                    <span className="author">by {this.props.presetObj.author}</span>
                    {
                        false && tags &&
                        <span className="tags">tags: {tags}</span>
                    }
                    {
                        dt &&
                        <span className="savedDate">{dt.toLocaleString()}</span>
                    }
                </div>
                {this.state.showingOverwriteConfirmation &&
                    <div className="confirmationBox">
                        Click 'OK' to overwrite "{this.props.presetObj.patchName}" with the live patch
                    <br />
                        <button className="OK" onClick={this.onClickOverwrite}>OK</button>
                        <button className="Cancel" onClick={this.onCancelOverwrite}>Cancel</button>
                    </div>
                }
                {this.state.showingDeleteConfirmation &&
                    <div className="confirmationBox">
                        Click 'OK' to delete "{this.props.presetObj.patchName}".
                    <br />
                        <button className="OK" onClick={this.onClickDelete}>OK</button>
                        <button className="Cancel" onClick={this.onCancelDelete}>Cancel</button>
                    </div>
                }

            </li>
        );
    }
};




class InstrumentPresetList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filterTxt: "",
        };
    }

    onFilterChange = (txt) => {
        this.setState({ filterTxt: txt });
    };

    presetMatches(p, txt) {
        let keys = txt.toLowerCase().split(" ");
        keys = keys.map(k => k.trim());
        keys = keys.filter(k => k.length > 0);
        if (keys.length < 1) return true;
        let ret = false;
        if (keys.some(k => p.patchName.toLowerCase().includes(k))) return true;
        if (!p.tags) return false;
        return keys.some(k => p.tags.toLowerCase().includes(k));
    }

    onClickInitPreset = () => {
        this.props.app.loadInitPatch();
        gStateChangeHandler.OnStateChange();
    }

    render() {
        const bank = this.props.app.roomState.GetPresetBankForInstrument(this.props.instrument);
        const lis = bank.presets.filter(p => this.presetMatches(p, this.state.filterTxt)).map(preset => (
            <InstrumentPreset observerMode={this.props.observerMode} key={preset.presetID} app={this.props.app} presetObj={preset}></InstrumentPreset>
        ));
        return (
            <div className="presetList">
                Presets
                <div className="presetFilter">🔎<DFReactUtils.TextInputFieldExternalState onChange={this.onFilterChange} value={this.state.filterTxt}></DFReactUtils.TextInputFieldExternalState></div>
                <ul>


                    <li>
                        <div className="buttonContainer">
                            {!this.props.observerMode && <button onClick={this.onClickInitPreset}>📂Load</button>}
                        </div>
                        <span className="presetName">init</span>
                    </li>



                    {lis}
                </ul>
            </div>
        );
    }
};

// key={cc} app={this.props.app} instrument={this.props.instrument} observerMode={this.props.observerMode} cc={cc} />
class MidiCCMappingInfo extends React.Component {
    render() {
        let mappingList = null;
        const mappedParams = this.props.instrument.getMappingSpecsForMidiCC(this.props.cc);
        mappingList = (<ul className="midiCCmappingList">
            {mappedParams.map(spec => {
                const effectiveRange = this.props.instrument.getEffectiveMappingRange(spec);
                return (
                    <li key={spec.param.paramID}>
                        → {this.props.instrument.getParamDisplayName(spec.param)} ({effectiveRange[0].toFixed(2)} to {effectiveRange[1].toFixed(2)})
                        ↠ <div className="mappedLiveValue">{spec.param.currentValue.toFixed(2)}</div>
                    </li>
                )
            }
            )}
        </ul>);

        return (
            <li>
                MIDI CC #{this.props.cc}
                {mappingList}
            </li>);
    }
};

// props.groupSpec
// props.app
// props.filteredParams
class InstrumentParamGroup extends React.Component {

    clickCopyToOsc(destOscIndex) {
        const patchObj = this.props.instrument.getPatchObjectToCopyOscillatorParams(this.props.groupSpec.oscillatorSource, destOscIndex);
        this.props.app.loadPatchObj(patchObj, false);
        gStateChangeHandler.OnStateChange();
    };

    render() {
        const arrowText = DF.getArrowText(this.props.isShown)

        let createParam = (p) => {
            if (p.hidden) return null;

            switch (p.parameterType) {
                case DF.InstrumentParamType.intParam:
                    if (p.renderAs == "buttons") {
                        return (<InstButtonsParam key={p.paramID} app={this.props.app} instrument={this.props.instrument} observerMode={this.props.observerMode} param={p}></InstButtonsParam>);
                    } else if (p.renderAs == "dropdown") {
                        return (<InstDropdownParam key={p.paramID} app={this.props.app} instrument={this.props.instrument} observerMode={this.props.observerMode} param={p}></InstDropdownParam>);
                    } else {
                        return (<InstIntParam key={p.paramID} app={this.props.app} instrument={this.props.instrument} observerMode={this.props.observerMode} param={p}></InstIntParam>);
                    }
                case DF.InstrumentParamType.floatParam:
                    return (<InstFloatParam key={p.paramID} app={this.props.app} instrument={this.props.instrument} observerMode={this.props.observerMode} param={p}></InstFloatParam>);
                case DF.InstrumentParamType.textParam:
                    return (<InstTextParam key={p.paramID} app={this.props.app} instrument={this.props.instrument} observerMode={this.props.observerMode} param={p}></InstTextParam>);
                case DF.InstrumentParamType.cbxParam:
                    return (<InstCbxParam key={p.paramID} app={this.props.app} instrument={this.props.instrument} observerMode={this.props.observerMode} param={p}></InstCbxParam>);
                case DF.InstrumentParamType.inlineLabel:
                    return (<li key={p.paramID} className="inlineLabel">{p.inlineLabel}</li>);
            }
        };

        if (!this.props.groupSpec.shown) return null;
        let className = "instParamGroup " + this.props.groupSpec.cssClassName;

        let groupControls = this.props.groupSpec.groupControls === "osc" && !this.props.observerMode && (
            <div className="groupControls">
                {this.props.groupSpec.oscillatorDestinations.map(destOscIndex => (
                    <button key={destOscIndex} onClick={() => this.clickCopyToOsc(destOscIndex)}>Copy to OSC {["A", "B", "C", "D"][destOscIndex]}</button>
                ))}
            </div>
        );

        let midiCClist = null;
        if (this.props.isShown && this.props.groupSpec.isMacroGroup) {
            // show a list of mapped midi CCs.
            const ccs = this.props.instrument.getMappedMidiCCs();
            midiCClist = (<ul className="midiCCList">
                {ccs.map(cc => (
                    <MidiCCMappingInfo key={"cc" + cc} app={this.props.app} instrument={this.props.instrument} observerMode={this.props.observerMode} cc={cc} />
                ))}
            </ul>)
        }

        return (
            <fieldset key={this.props.groupSpec.displayName} className={className}>
                <legend onClick={() => this.props.onToggleShown()}>{arrowText} {this.props.groupSpec.displayName} <span className="instParamGroupNameAnnotation">{this.props.groupSpec.annotation}</span></legend>
                {this.props.isShown &&
                    <ul className="instParamList">
                        {groupControls}
                        {this.props.filteredParams.filter(p => p.groupName == this.props.groupSpec.internalName).map(p => createParam(p))}
                    </ul>
                }
                {midiCClist}
            </fieldset>
        );
    }
};


class InstrumentParams extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            presetListShown: false,
            filterTxt: "",
            isShown: true,
            shownGroupNames: [],
            showingAllGroups: false,
            showingFactoryResetConfirmation: false,
            showingClipboardControls: false,
            showingOverwriteConfirmation: false,
        };
        this.state.shownGroupNames = this.props.instrument.GetDefaultShownGroupsForInstrument();
    }


    onOpenClicked = () => {
        this.setState({ presetListShown: !this.state.presetListShown });
    };

    onExportClicked = () => {
        let presetObj = this.props.instrument.exportPatchObj();
        let txt = JSON.stringify(presetObj, null, 2);
        navigator.clipboard.writeText(txt).then(() => {
            alert('Patch was copied to the clipboard.')
        }, () => {
            alert('Unable to copy patch.')
        });
    };

    onImportClicked = () => {
        navigator.clipboard.readText().then(text => {
            try {
                let presetObj = JSON.parse(text);
                this.props.app.loadPatchObj(presetObj, true);
                gStateChangeHandler.OnStateChange();
            } catch (e) {
                alert(`Unable to import; probably badly formatted text... Exception: ${e}`);
            }
        })
            .catch(err => {
                alert('Unable to read clipboard');
            });
    };

    onReleaseClick = () => {
        this.props.app.ReleaseInstrument();
    };

    onFilterChange = (txt) => {
        this.setState({ filterTxt: txt });
        this.showAllGroups();
    };

    showAllGroups = () => {
        this.setState({ showingAllGroups: true });
    };

    onToggleShownClick = (e) => {
        if (e.target.id != "showInstrumentPanel") {
            return; // ignore clicks on children; only accept direct clicks.
        }
        this.setState({ isShown: !this.state.isShown });
    };

    clickFocusGroupName(groupName) {
        if (!this.state.showingAllGroups && this.isGroupNameShown(groupName) && this.state.shownGroupNames.length == 1) {
            // if you click on a showing group name and there are others shown, focus it.
            // if you click on a showing group name it's the only one shown, then hide all.
            this.setState({ shownGroupNames: [], showingAllGroups: false });
            return;
        }
        this.setState({ shownGroupNames: [groupName], showingAllGroups: false });
    };
    onToggleGroupShown(groupName) {
        if (this.isGroupNameShown(groupName)) {
            let x = this.state.shownGroupNames.filter(gn => gn != groupName);
            this.setState({ shownGroupNames: x, showingAllGroups: false });
            return;
        }

        this.state.shownGroupNames.push(groupName);
        this.setState({ shownGroupNames: this.state.shownGroupNames, showingAllGroups: false });
        return;
    };

    clickAllGroup = () => {
        if (this.state.showingAllGroups) {
            // then show NONE.
            this.setState({ shownGroupNames: [] });
        }
        this.setState({ showingAllGroups: !this.state.showingAllGroups });
    }

    isGroupNameShown(groupName) {
        return this.state.showingAllGroups || this.state.shownGroupNames.some(gn => gn == groupName);
    }

    onPanicClick = () => {
        this.props.app.MIDI_AllNotesOff();
    };

    onExportBankClicked = () => {
        let txt = this.props.app.roomState.exportAllPresetsJSON(this.props.instrument);
        navigator.clipboard.writeText(txt).then(() => {
            alert('Bank was copied to the clipboard.')
        }, () => {
            alert('Unable to copy bank.')
        });
    };

    onSaveNewPreset = () => {
        this.props.app.savePatchAsNewPreset();
    }

    onFactoryReset = () => {
        this.props.app.factoryResetInstrument();
        this.setState({ showingFactoryResetConfirmation: false });
    }
    onBeginFactoryReset = () => {
        this.setState({ showingFactoryResetConfirmation: true });
    }
    cancelFactoryReset = () => {
        this.setState({ showingFactoryResetConfirmation: false });
    }

    onSaveAsExistingPreset = () => {
        this.props.app.saveLoadedPreset();
        this.setState({ showingOverwriteConfirmation: false });
    }
    onBeginOverwrite = () => {
        this.setState({ showingOverwriteConfirmation: true });
    };
    onCancelOverwrite = () => {
        this.setState({ showingOverwriteConfirmation: false });
    }



    onImportBankClicked = () => {
        navigator.clipboard.readText().then(text => {
            //console.log('Pasted content: ', text);
            try {
                this.props.app.mergePresetBankJSON(text);
                gStateChangeHandler.OnStateChange();
            } catch (e) {
                alert(`Unable to import; probably badly formatted text... Exception: ${e}`);
            }
        })
            .catch(err => {
                alert('Unable to read clipboard');
            });
    };

    onClipboardShownClick = () => {
        this.setState({ showingClipboardControls: !this.state.showingClipboardControls });
    }

    onSelfMuteToggle = () => {
        this.props.app.toggleSelfMute();
        gStateChangeHandler.OnStateChange();
    }

    render() {
        const arrowText = this.state.presetListShown ? '⯆' : '⯈';

        let presetList = this.state.presetListShown && (
            <InstrumentPresetList observerMode={this.props.observerMode} instrument={this.props.instrument} app={this.props.app}></InstrumentPresetList>
        );

        let filterTxt = this.state.filterTxt.toLowerCase();
        let filteredParams = this.props.instrument.GetDisplayableParamList(filterTxt);

        // unique group names.
        let _groupNames = [...new Set(filteredParams.map(p => p.groupName))];
        _groupNames = _groupNames.filter(gn => filteredParams.find(p => p.groupName == gn && !p.hidden));

        let groupSpecs = _groupNames.map(gn => this.props.instrument.getGroupInfo(gn));
        groupSpecs = groupSpecs.filter(gs => gs.shown);

        let groupFocusButtons = groupSpecs.map(gs => (
            <button key={gs.internalName} className={this.isGroupNameShown(gs.internalName) ? "active paramGroupFocusBtn" : "paramGroupFocusBtn"} onClick={() => this.clickFocusGroupName(gs.internalName)}>{gs.displayName}</button>
        ));

        let groups = groupSpecs.map(gs => (<InstrumentParamGroup
            key={gs.internalName}
            groupSpec={gs}
            app={this.props.app}
            instrument={this.props.instrument}
            observerMode={this.props.observerMode}
            isShown={this.isGroupNameShown(gs.internalName)}
            onToggleShown={() => this.onToggleGroupShown(gs.internalName)}
            filteredParams={filteredParams}
        />));

        const shownStyle = this.state.isShown ? { display: 'block' } : { display: "none" };
        const mainArrowText = this.state.isShown ? '⯆' : '⯈';

        let presetID = this.props.instrument.GetParamByID("presetID").rawValue;
        let writableExistingPreset = null;
        if (presetID) {
            const bank = this.props.app.roomState.GetPresetBankForInstrument(this.props.instrument);

            writableExistingPreset = bank.presets.find(p => {
                const canWrite = this.props.app.myUser.IsAdmin() || !p.isReadOnly;
                return canWrite && p.presetID == presetID
            });
        }

        const instrumentSupportsPresets = this.props.instrument.supportsPresets;

        const groupFocusButtonStuff = this.state.isShown && ((groupSpecs.length > 1) || (this.state.filterTxt.length > 0)) && (
            <div className="paramGroupCtrl">
                <fieldset className="groupFocusButtons">
                    <legend>Param groups</legend>
                    <button className={this.state.showingAllGroups ? "active paramGroupFocusBtn" : "paramGroupFocusBtn"} onClick={() => this.clickAllGroup()}>All</button>
                    {groupFocusButtons}
                    <div className="paramFilter">Param filter🔎<DFReactUtils.TextInputFieldExternalState onChange={this.onFilterChange} value={this.state.filterTxt}></DFReactUtils.TextInputFieldExternalState></div>
                </fieldset>
            </div>
        );

        const allowFactoryReset = this.props.app.myUser.IsAdmin();

        const selfMuteCaption = "Monitor " + (this.props.app.isSelfMuted ? "🔇" : "🔊");

        return (
            <div className="component">
                <h2 id="showInstrumentPanel" style={{ cursor: 'pointer' }} onClick={this.onToggleShownClick}>
                    {mainArrowText}
                    {this.props.instrument.getDisplayName()}
                    <div className="buttonContainer">
                        <button onClick={this.props.toggleWideMode}>{this.props.isWideMode ? "⯈ Narrow" : "⯇ Wide"}</button>
                        {/* {!this.props.observerMode && <button onClick={this.onPanicClick}>Panic</button>} */}
                        {!this.props.observerMode && <button onClick={this.onSelfMuteToggle}>{selfMuteCaption}</button>}
                        {!this.props.observerMode && <button onClick={this.onReleaseClick}>Release</button>}
                        {!!this.props.observerMode && <button onClick={() => { gStateChangeHandler.observingInstrument = null; }}>Stop Observing</button>}
                    </div>
                </h2>
                <div style={shownStyle}>
                    {groupFocusButtonStuff}

                    {instrumentSupportsPresets &&
                        <fieldset className="instParamGroup presetsGroup">
                            <legend onClick={this.onOpenClicked}>{arrowText} Presets</legend>
                            {this.state.presetListShown && (
                                <ul className="instParamList">
                                    <InstTextParam key="patchName" observerMode={this.props.observerMode} app={this.props.app} instrument={this.props.instrument} param={this.props.instrument.GetParamByID("patchName")}></InstTextParam>
                                    <InstTextParam key="patchDescription" observerMode={this.props.observerMode} app={this.props.app} instrument={this.props.instrument} param={this.props.instrument.GetParamByID("description")}></InstTextParam>
                                    <InstTextParam key="patchTags" observerMode={this.props.observerMode} app={this.props.app} instrument={this.props.instrument} param={this.props.instrument.GetParamByID("tags")}></InstTextParam>
                                    {!this.props.observerMode && <li className="instPresetButtons">
                                        {writableExistingPreset && <button onClick={this.onBeginOverwrite}>💾 Overwrite "{writableExistingPreset.patchName}"</button>}

                                        {this.state.showingOverwriteConfirmation &&
                                            <div className="confirmationBox">
                                                Click 'OK' to overwrite "{writableExistingPreset.patchName}" with a patch named "{this.props.instrument.GetParamByID("patchName").currentValue}"<br />
                                                <button className="OK" onClick={this.onSaveAsExistingPreset}>OK</button>
                                                <button className="Cancel" onClick={this.onCancelOverwrite}>Cancel</button>
                                            </div>
                                        }


                                        <button onClick={this.onSaveNewPreset}>💾 Save as new preset "{this.props.instrument.GetParamByID("patchName").currentValue}"</button>
                                        {allowFactoryReset && <button onClick={this.onBeginFactoryReset}>⚠ Factory reset</button>}
                                        {this.state.showingFactoryResetConfirmation &&
                                            <div className="confirmationBox">
                                                Click OK to reset all presets to factory defaults. It applies only to this instrument.
                                        <br />
                                                <button className="ok" onClick={this.onFactoryReset}>OK</button>
                                                <button className="cancel" onClick={this.cancelFactoryReset}>Cancel</button>
                                            </div>
                                        }
                                    </li>}

                                    <li className="instPresetButtons">
                                        <fieldset className="clipboardControls">
                                            <legend onClick={this.onClipboardShownClick}>{DF.getArrowText(this.state.showingClipboardControls)} Clipboard</legend>
                                            {this.state.showingClipboardControls && (
                                                <div>
                                                    <button onClick={this.onExportClicked}>Copy live settings to clipboard</button>
                                                    { !this.props.observerMode && <button onClick={this.onImportClicked}>Paste live settings from clipboard</button>}<br />
                                                    <button onClick={this.onExportBankClicked}>Export preset bank to clipboard</button>
                                                    { !this.props.observerMode && <button onClick={this.onImportBankClicked}>Import preset bank from clipboard</button>}<br />
                                                </div>
                                            )}
                                        </fieldset>
                                    </li>

                                    {presetList}

                                </ul>)}

                        </fieldset>
                    }
                    {groups}
                </div>
            </div>
        );
    }
}









// props
// - app
// - displayhelper
class CheerControls extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            text: '✨'
        };
        if (window.localStorage.getItem(DFReactUtils.getRoomID(this.props.app) + "_cheerText")) {
            this.state.text = window.localStorage.getItem(DFReactUtils.getRoomID(this.props.app) + "_cheerText");
        }
        this.mouseIn = false;
        this.mouseDown = false;
        this.timerRunning = false;
        //this.mousePos = { x: 0, y: 0 }; // track this on mouse move.
        console.assert(this.props.displayHelper);
    }

    // there are really 2 mouse states we have to track:
    // - mouse inside the element? this is done with mouseenter and mouseleave
    // - mouse button pressed? this is done with mousedown, mouseup, but you can for example mousedown, leave the element, and re-enter, and we need to know whether you released the button or not.
    //   so this also needs help from mouseenter/leave.

    // the timer continues to fire when both mouse button is down and mouse is inside.

    onTimeout = () => {
        if (!this.props.app || !this.props.app.roomState) {
            this.timerRunning = false;
            return null;
        }

        // perform cheer
        this.props.app.SendCheer(this.state.text, this.props.app.myUser.position.x, this.props.app.myUser.position.y);

        // while allowing, continue timer
        if (this.mouseIn && this.mouseDown) {
            setTimeout(() => { this.onTimeout() }, DF.ClientSettings.MinCheerIntervalMS);
        } else {
            this.timerRunning = false;
        }
    };

    onMouseDown = (e) => {
        this.mouseIn = true;
        this.mouseDown = true; // any time you enter, just assume mouse is released.

        // do initial cheer,
        this.props.app.SendCheer(this.state.text, this.props.app.myUser.position.x, this.props.app.myUser.position.y);

        if (!this.timerRunning) {
            setTimeout(() => { this.onTimeout() }, DF.ClientSettings.MinCheerIntervalMS);
        }
    };

    onMouseUp = (e) => {
        this.mouseDown = false; // this will stop the timer, if it was started.
    };

    onMouseEnter = (e) => {
        this.mouseIn = true;
        this.mouseDown = false; // any time you enter, just assume mouse is released.
    };

    onMouseLeave = (e) => {
        this.mouseIn = false;
        this.mouseDown = false;
    };

    render() {
        // onClick={() => this.props.handleCheerClick(this.state.text)}
        if (!this.props.app || !this.props.app.roomState) return null;
        return (
            <div id="cheerControl">
                <div id="cheerButton" className="cheerButton" onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} >cheer</div>
                <DFReactUtils.TextInputFieldExternalState
                    value={this.state.text}
                    onChange={(val) => {
                        window.localStorage.setItem(DFReactUtils.getRoomID(this.props.app) + "_cheerText", val);
                        this.setState({ text: val });
                    }}
                />
            </div>
        );
    }
}


class UserState extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            userName: '',
            userColor: '',
            isShown: false,
        };

        if (this.props.app && this.props.app.myUser) {
            this.state.userName = this.props.app.myUser.name;
            this.state.userColor = this.props.app.myUser.color;
        }
    }

    sendUserStateChange = (e) => {
        this.props.app.SetUserNameColor(this.state.userName, this.state.userColor);
    };

    handleToggleShownClick = () => {
        this.setState({ isShown: !this.state.isShown });
    };

    render() {
        let inputList = null;
        if (this.props.app && this.props.app.midi) {
            if (this.props.app.deviceNameList.length == 0) {
                inputList = (<li>(no midi devices found)</li>);
            } else {
                inputList = this.props.app.deviceNameList.map(i => {
                    if (this.props.app.midi.IsListeningOnDevice(i)) {
                        return (
                            <li key={i}>
                                <button onClick={() => this.props.app.midi.StopListeningOnDevice(i)}>Stop using {i}</button>
                            </li>
                        );
                    } else {
                        return (
                            <li key={i}>
                                <button onClick={() => this.props.app.midi.ListenOnDevice(i)}>Start using {i}</button>
                            </li>
                        );
                    }
                });
            }
        }

        let connectCaption = "You";

        const disconnectBtn = this.props.app ? (
            <li><button onClick={this.props.handleDisconnect}>Disconnect</button><div style={{ height: 20 }}>&nbsp;</div></li>
        ) : null;

        const changeUserStateBtn = this.props.app ? (
            <li style={{ marginBottom: 10 }}><button onClick={this.sendUserStateChange}>update above stuff</button></li>
        ) : null;

        const randomColor = `rgb(${[1, 2, 3].map(x => Math.random() * 256 | 0)})`;

        const ulStyle = this.state.isShown ? { display: 'block' } : { display: "none" };
        const arrowText = this.state.isShown ? '⯆' : '⯈';

        const validationMsg = DFReactUtils.getValidationErrorMsg(this.state.userName, this.state.userColor);
        const validationMarkup = validationMsg.length ? (
            <div className="validationError">{validationMsg}</div>
        ) : null;

        return (
            <div className="component">
                <h2 style={{ cursor: 'pointer' }} onClick={this.handleToggleShownClick}>{arrowText} {connectCaption}</h2>
                <ul style={ulStyle}>
                    {disconnectBtn}
                    <li><DFReactUtils.TextInputField style={{ width: 80 }} default={this.state.userName} onChange={(val) => this.setState({ userName: val })} onEnter={this.sendUserStateChange} /> name</li>
                    <li><DFReactUtils.TextInputFieldExternalState
                        style={{ width: 80 }}
                        value={this.state.userColor}
                        onChange={(val) => this.setState({ userColor: val })}
                        onEnter={this.sendUserStateChange} />
                        <button style={{ backgroundColor: this.state.userColor }} onClick={() => { this.setState({ userColor: randomColor }) }} >random</button> color
                    </li>
                    {validationMarkup}
                    {changeUserStateBtn}
                    {inputList}
                </ul>
            </div>
        );
    }
}





class UserList extends React.Component {
    render() {
        if (!this.props.app || !this.props.app.roomState) {
            return null;
        }

        const room = this.props.app.rooms && this.props.app.rooms.find(r => r.roomID == this.props.app.roomState.roomID);

        const users = this.props.app.roomState.users.map(u => (
            <li key={u.userID}>
                {this.props.app.myUser.IsAdmin() && <UIUser.AdminUserMgmt user={u} />}
                <UIUser.UIUserName user={u} />
                <span className="userPing"> ({u.pingMS}ms ping)</span>
            </li>
        ));

        return (
            <div className="component userList">
                <h2><span className="roomName">{this.props.app.roomState.roomTitle}</span>
                    {room &&
                        <span className="roomHeaderStats">[<span className="userCount">{room.users.length}</span>] ♫<span className="noteOns">{room.stats.noteOns}</span></span>
                    }
                </h2>
                <ul>
                    {users}
                </ul>
            </div>
        );
    }
}

class WorldStatus extends React.Component {
    render() {
        if (!this.props.app || !this.props.app.roomState || !this.props.app.rooms) {
            return null;
        }

        const rooms = this.props.app.rooms.filter(r => r.roomID != this.props.app.roomState.roomID);

        let userList = (room) => room.users.map(u => (
            <li key={u.userID}><span className="userName" style={{ color: u.color }}>{u.name}</span><span className="userPing"> ({u.pingMS}ms ping)</span></li>
        ));

        const roomsMarkup = rooms.map(room => (
            <dl className="room" key={room.roomName}>
                {/* <dt className="roomStats"> */}
                <dt><span className="roomName">{room.roomName}</span> [<span className="userCount">{room.users.length}</span>] ♫<span className="noteOns">{room.stats.noteOns}</span></dt>
                {room.users.length > 0 &&
                    <dd>
                        <ul className="userList">{userList(room)}</ul>
                    </dd>}
            </dl>
        ));

        return (
            <div className="component worldStatus">
                <h2>Other rooms</h2>
                {roomsMarkup}
            </div>
        );
    }
}

class BPMControls extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isShowing: false
        };
    }

    onClickHeader = () => {
        this.setState({ isShowing: !this.state.isShowing });
    }

    setRoomBPM = (v) => {
        if(v.target.value < 1 || v.target.value > 200)
            return;
        
        this.props.app.metronome.bpm = v.target.value;
        if (this.props.app.metronome.syncWithRoom)
            this.props.app.net.SendRoomBPM(v.target.value);
        gStateChangeHandler.OnStateChange();
    }

    onClickMetronome = () => {
        this.props.app.metronome.isMuted = !this.props.app.metronome.isMuted;
        gStateChangeHandler.OnStateChange();
    }

    onClickSync = () => {
        this.props.app.metronome.syncWithRoom = !this.props.app.metronome.syncWithRoom;
        gStateChangeHandler.OnStateChange();
    }

    render() {
        if (!this.props.app || !this.props.app.roomState || this.props.app.metronome.bpm == null) {
            return null;
        }

        const ulStyle = this.state.isShowing ? { display: 'block' } : { display: "none" };
        
        return (
            <div className="component bpmControls" style={{ whiteSpace: "nowrap" }}>
                <h2 style={{ cursor: "pointer" }} onClick={this.onClickHeader}>{DF.getArrowText(this.state.isShowing)} Metronome</h2>
                {this.state.isShowing &&
                    <ul style={ulStyle}>
                        <li style={{ marginBottom: 10 }}><input type="text" pattern="[0-9]*" value={this.props.app.metronome.bpm} onChange={this.setRoomBPM} /> BPM</li>
                        <li><button className="metronomeButton" onClick={this.onClickMetronome}>Switch {this.props.app.metronome.isMuted ? "On" : "Off"} </button> Metronome</li>
                        <li><button className="syncButton" onClick={this.onClickSync}>Switch {this.props.app.metronome.syncWithRoom ? "Off" : "On"}</button> Server-side mode</li>
                    </ul>
                }

            </div>

        );
    }

}

class InstrumentList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isShowing: true
        };
    }

    onClickHeader = () => {
        this.setState({ isShowing: !this.state.isShowing });
    }

    observeInstrument(instrument) {
        this.props.app.ReleaseInstrument();
        gStateChangeHandler.observingInstrument = instrument;
    }

    stopObserving() {
        gStateChangeHandler.observingInstrument = null;
    }

    renderInstrument(i) {
        let app = this.props.app;

        let inUse = !!i.controlledByUserID;
        let idle = false;
        let ownedBy = null;
        if (inUse) {
            let foundUser = this.props.app.roomState.FindUserByID(i.controlledByUserID);
            if (foundUser) {
                ownedBy = (<span className="takenBy">(<span style={{ color: foundUser.user.color }}>{foundUser.user.name}</span>)</span>);
                idle = foundUser.user.idle;// user is taken, but considered idle. so we can show it.
            }
        }

        const isYours = (i.controlledByUserID == app.myUser.userID);
        const takeable = app.midi.AnyMidiDevicesAvailable() && (!inUse || idle);

        const releaseBtn = isYours && (
            <button className="release" onClick={() => this.props.app.ReleaseInstrument()}>release</button>
        );

        const isYourObserving = gStateChangeHandler.observingInstrument && gStateChangeHandler.observingInstrument.instrumentID == i.instrumentID;

        const stopObservingBtn = isYourObserving && (<button className="stopObserving" onClick={() => this.stopObserving()}>stop obs</button>);

        idle = idle && (<span className="idleIndicator">(Idle)</span>);

        const playBtn = takeable && (
            <button onClick={() => {
                this.stopObserving();
                app.RequestInstrument(i.instrumentID);
            }}>play</button>
        );

        const observeBtn = !isYours && i.supportsObservation && inUse && (
            <button className="observe" onClick={() => this.observeInstrument(i)}>observe</button>
        );

        return (
            <li className="instrument" key={i.instrumentID} style={{ color: i.color }}>
                <div className="buttonContainer">{playBtn}{releaseBtn}{observeBtn}{stopObservingBtn}</div>
                {idle} {i.getDisplayName()} {ownedBy}
            </li>
        );
    }

    render() {
        if (!this.props.app || !this.props.app.roomState || (this.props.app.roomState.instrumentCloset.length < 1)) {
            return null;
        }
        const instruments = this.props.app.roomState.instrumentCloset.map(i => this.renderInstrument(i));
        return (
            <div className="component instrumentCloset" style={{ whiteSpace: "nowrap" }}>
                <h2 style={{ cursor: "pointer" }} onClick={this.onClickHeader}>{DF.getArrowText(this.state.isShowing)} Instrument Closet</h2>
                {this.state.isShowing &&
                    <ul>
                        {instruments}
                    </ul>
                }
            </div>
        );
    }
}

class RightArea extends React.Component {

    render() {
        let myInstrument = null;
        let instParams = null;
        if (this.props.app && this.props.app.roomState) {
            myInstrument = this.props.app.roomState.FindInstrumentByUserID(this.props.app.myUser.userID);
            if (myInstrument) myInstrument = myInstrument.instrument;
        }
        if (myInstrument && myInstrument.params.length > 0) {
            instParams = (<InstrumentParams app={this.props.app} observerMode={false} instrument={myInstrument} toggleWideMode={this.props.toggleWideMode} isWideMode={this.props.isWideMode}></InstrumentParams>);
        } else {
            if (gStateChangeHandler.observingInstrument) {
                instParams = (<InstrumentParams app={this.props.app} observerMode={true} instrument={gStateChangeHandler.observingInstrument} toggleWideMode={this.props.toggleWideMode} isWideMode={this.props.isWideMode}></InstrumentParams>);
            }
        }

        return (
            <div id="rightArea" style={{ gridArea: "rightArea" }}>
                {instParams}
            </div>
        );
    }
}

class LeftArea extends React.Component {

    render() {
        const userState = (!this.props.app) ? null : (
            <UserState app={this.props.app} handleDisconnect={this.props.handleDisconnect} />
        );
        const adminControls = (this.props.app && this.props.app.myUser.IsAdmin()) && (
            <DFAdminControls.AdminControls app={this.props.app}></DFAdminControls.AdminControls>
        );
        return (
            <div id="leftArea" style={{ gridArea: "leftArea" }}>
                {userState}
                <InstrumentList app={this.props.app} />
                <BPMControls app={this.props.app} />
                <UserList app={this.props.app} />
                <WorldStatus app={this.props.app} />
                {adminControls}
            </div>
        );
    }
}



class UserAvatar extends React.Component {

    onReleaseInstrument = () => {
        if (!this.props.app) return null;
        this.props.app.ReleaseInstrument();
    };

    render() {
        if (!this.props.app) return null;
        if (!this.props.app.roomState) return null;
        console.assert(this.props.displayHelper);
        const isMe = (this.props.app.myUser.userID == this.props.user.userID);

        const inst = this.props.app.roomState.FindInstrumentByUserID(this.props.user.userID);
        let instMarkup = null;
        if (inst) {
            const instStyle = {
                color: inst.instrument.color,
            };
            let releaseButton = isMe ? (
                <button onClick={this.onReleaseInstrument}>Release</button>
            ) : null;

            instMarkup = (
                <div style={instStyle} className="userAvatarInstrument">
                    playing {inst.instrument.getDisplayName()}
                    <br />
                    {releaseButton}
                </div>
            );
        }

        const pos = this.props.displayHelper().roomToScreenPosition(this.props.user.position);

        const style = {
            left: pos.x,
            top: pos.y,
            color: this.props.user.color,
            borderColor: this.props.user.color
        };

        const className = "userAvatar userAvatarActivityBump1" + (isMe ? " me" : "");

        return (
            <div className={className} id={'userAvatar' + this.props.user.userID} style={style}>
                <div>
                    {/* <span className="userName">{this.props.user.name}</span> */}
                    <UIUser.UIUserName user={this.props.user} />
                </div>
                {instMarkup}
            </div>
        );
    }
};


class UIAudioVisualizationRoomItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.canvID = "canv_" + this.props.item.itemID;
    }

    componentDidMount() {
        //this.audioVis = new AudioVis(document.getElementById(this.canvID), this.props.app.synth.analysisNode);
    }
    componentWillUnmount() {
        if (this.audioVis) {
            this.audioVis.stop();
            this.audioVis = null;
        }
    }

    render() {
        return null; // for the moment don't show vis. it needs refinement and i don't want to refine until we use WebGL more.
        const pos = this.props.displayHelper().roomToScreenPosition(this.props.item.rect);

        let style = Object.assign({
            left: pos.x,
            top: pos.y,
            width: this.props.item.rect.w,
            height: this.props.item.rect.h,
        }, this.props.item.style);

        return (
            <canvas className="roomItem" style={style} id={this.canvID}></canvas>
        );
    }
};



class UIRoomItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    onClickSign = () => {
        this.props.item.params.isShown = !this.props.item.params.isShown;
        this.setState({});
    }
    render() {
        const pos = this.props.displayHelper().roomToScreenPosition(this.props.item.rect);

        let style = Object.assign({
            left: pos.x,
            top: pos.y,
            width: this.props.item.rect.w,
            height: this.props.item.rect.h,
        }, this.props.item.style);

        let signMarkup = null;
        if (this.props.item.itemType == DF.DFRoomItemType.sign) {
            let signStyle = Object.assign({
                left: pos.x,
                top: pos.y,
                opacity: this.props.item.params.isShown ? "100%" : "0",
            }, this.props.item.params.style);

            signMarkup = (<div className="roomSign" onClick={this.onClickSign} style={signStyle}
                dangerouslySetInnerHTML={{ __html: this.props.item.params.message }}></div>
            );
        } else if (this.props.item.itemType == DF.DFRoomItemType.audioVisualization) {
            return (<UIAudioVisualizationRoomItem item={this.props.item} displayHelper={this.props.displayHelper} app={this.props.app} />);
        }

        return (
            <div>
                <div className="roomItem" style={style}>{this.props.item.name}</div>
                {signMarkup}
            </div>
        );
    }
};





class ShortChatLog extends React.Component {
    render() {
        if (!this.props.app) return null;

        const lis = this.props.app.shortChatLog.map(msg => {

            const dt = new Date(msg.timestampUTC);
            const timestamp = dt.toLocaleTimeString();// `${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`;

            switch (msg.messageType) {
                case DF.ChatMessageType.aggregate:
                    {
                        return msg.messages.map(aggMsg => (
                            <div className="chatLogEntryAggregate" key={msg.messageID}>{timestamp} {aggMsg}</div>
                        ));
                    }
                case DF.ChatMessageType.join:
                    let fromRoomTxt = msg.fromRoomName && `(from ${msg.fromRoomName})`;
                    return (
                        <div className="chatLogEntryJoin" key={msg.messageID}>{timestamp} <span style={{ color: msg.fromUserColor }}>{msg.fromUserName} has joined the {this.props.app.roomState.roomTitle} jam {fromRoomTxt}</span></div>
                    );
                case DF.ChatMessageType.part:
                    let toRoomTxt = msg.toRoomName && `(to ${msg.toRoomName})`;
                    return (
                        <div className="chatLogEntryJoin" key={msg.messageID}>{timestamp} <span style={{ color: msg.fromUserColor }}>{msg.fromUserName} has left the {this.props.app.roomState.roomTitle} jam {toRoomTxt}</span></div>
                    );
                case DF.ChatMessageType.nick:
                    return (
                        <div className="chatLogEntryNick" key={msg.messageID}>{timestamp} <span style={{ color: msg.fromUserColor }}>{msg.fromUserName} is now known as {msg.toUserName}</span></div>
                    );
                case DF.ChatMessageType.chat:
                    return (
                        <div className="chatLogEntryChat" key={msg.messageID}>{timestamp} <span style={{ color: msg.fromUserColor }}>[{msg.fromUserName}]</span> {msg.message}</div>
                    );
            }

            return null;
        });

        return (
            <div className='shortChatLog'>
                {/* <button className="switchChatView" onClick={this.props.onToggleView}>Switch view</button> */}
                {lis}
            </div>
        );
    }
};






class FullChatLog extends React.Component {
    render() {
        if (!this.props.app || !this.props.app.roomState) return null;

        const lis = this.props.app.roomState.chatLog.map(msg => {

            const dt = new Date(msg.timestampUTC);
            const timestamp = dt.toLocaleTimeString();// `${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`;

            switch (msg.messageType) {
                case DF.ChatMessageType.join:
                    let fromRoomTxt = msg.fromRoomName && `(from ${msg.fromRoomName})`;
                    return (
                        <li className="chatLogEntryJoin" key={msg.messageID}>{timestamp} <span style={{ color: msg.fromUserColor }}>{msg.fromUserName} has joined the {this.props.app.roomState.roomTitle} jam {fromRoomTxt}</span></li>
                    );
                case DF.ChatMessageType.part:
                    let toRoomTxt = msg.toRoomName && `(to ${msg.toRoomName})`;
                    return (
                        <li className="chatLogEntryJoin" key={msg.messageID}>{timestamp} <span style={{ color: msg.fromUserColor }}>{msg.fromUserName} has left the {this.props.app.roomState.roomTitle} jam {toRoomTxt}</span></li>
                    );
                case DF.ChatMessageType.nick:
                    return (
                        <li className="chatLogEntryNick" key={msg.messageID}>{timestamp} <span style={{ color: msg.fromUserColor }}>{msg.fromUserName} is now known as {msg.toUserName}</span></li>
                    );
                case DF.ChatMessageType.chat:
                    return (
                        <li className="chatLogEntryChat" key={msg.messageID}>{timestamp} <span style={{ color: msg.fromUserColor }}>[{msg.fromUserName}]</span> {msg.message}</li>
                    );
            }

            return null;
        });

        return (
            <div className='fullChatLog'>
                {/* <button className="switchChatView" onClick={this.props.onToggleView}>Switch view</button> */}
                <ul style={{ height: "100%" }}>
                    {lis}
                </ul>
            </div>
        );
    }
};









class AnnouncementArea extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }
    render() {
        if (!this.props.app || !this.props.app.roomState) return null;

        let html = this.props.app.roomState.announcementHTML;
        const countdownPrefix = "{{countdown:";
        const countdownSuffix = "}}";
        let begin = html.indexOf(countdownPrefix);
        if (begin != -1) {
            let end = html.indexOf(countdownSuffix, begin);
            if (end != -1) {
                try {
                    // countdown timer
                    let dt = html.substring(begin + countdownPrefix.length, end);
                    let remainingMS = (new Date(dt)) - (new Date());
                    const info = getTimeSpanInfo(remainingMS);
                    //console.log(`countdown time: ${dt}; remaining ms: ${remainingMS}`);
                    //console.log(info);
                    html = html.substring(0, begin) + info.LongString + html.substring(end + countdownSuffix.length);
                    setTimeout(() => {
                        this.setState({});
                    }, 1000);
                } catch (e) {
                    // whatever.
                }
            }
        }

        return (
            <div id="announcementArea" dangerouslySetInnerHTML={{ __html: html }}></div>
        );
    }
};

class RoomAlertArea extends React.Component {
    render() {
        if (!this.props.app || !this.props.app.roomState) return null;

        if (this.props.app.myInstrument && !this.props.app.midi.IsListeningOnAnyDevice()) {
            return (
                <div id="roomAlertArea">
                    <div>Select a MIDI input device to start playing</div>
                    {this.props.app.deviceNameList.map(i => (
                        <button key={i} onClick={() => { this.props.app.midi.ListenOnDevice(i); gStateChangeHandler.OnStateChange(); }}>Start using {i}</button>
                    ))}
                </div>
            );
        }
        return null;
    }
};

class RoomArea extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            scrollSize: { x: 0, y: 0 },// track DOM scrollHeight / scrollWidth
            showFullChat: false,
        };
        this.screenToRoomPosition = this.screenToRoomPosition.bind(this);
        this.roomToScreenPosition = this.roomToScreenPosition.bind(this);
    }

    // helper APIs
    // where to display the background
    getScreenScrollPosition() {
        if ((!this.props.app) || (!this.props.app.roomState)) return { x: 0, y: 0 };
        let userPos = this.props.app.myUser.position;
        let x1 = (this.state.scrollSize.x / 2) - userPos.x;
        let y1 = (this.state.scrollSize.y / 2) - userPos.y;

        // that will put you square in the center of the screen every time.
        // now calculate the opposite: where the room is always centered.
        let x2 = (this.state.scrollSize.x / 2) - (this.props.app.roomState.width / 2);
        let y2 = (this.state.scrollSize.y / 2) - (this.props.app.roomState.height / 2);

        // so interpolate between the two. smaller = easier on the eyes, the room stays put, but parts can become unreachable.
        let t = 0.85;

        return {
            x: ((x1 * t) + (x2 * (1 - t))),
            y: ((y1 * t) + (y2 * (1 - t))),
        };
    }

    screenToRoomPosition(pos) { // takes html on-screen x/y position and translates to "world" coords
        if ((!this.props.app) || (!this.props.app.roomState)) return { x: 0, y: 0 };
        let sp = this.getScreenScrollPosition();
        let ret = {
            x: pos.x - sp.x,
            y: pos.y - sp.y,
        };
        if (ret.x < 0) { ret.x = 0; }
        if (ret.y < 0) { ret.y = 0; }
        if (ret.x > this.props.app.roomState.width) { ret.x = this.props.app.roomState.width; }
        if (ret.y > this.props.app.roomState.height) { ret.y = this.props.app.roomState.height; }
        return ret;
    }

    roomToScreenPosition(pos) {
        let sp = this.getScreenScrollPosition();
        return {
            x: pos.x + sp.x,
            y: pos.y + sp.y,
        };
    }

    onClick(e) {
        if ((!this.props.app) || (!this.props.app.roomState)) return false;
        if (!e.target || e.target.id != "roomArea") return false; // don't care abotu clicking anywhere except ON THIS DIV itself
        const roomPos = this.screenToRoomPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });

        this.props.app.SetUserPosition(roomPos);
    }

    updateScrollSize() {
        let e = document.getElementById("roomArea");
        if (e.clientWidth != this.state.scrollSize.x || e.clientHeight != this.state.scrollSize.y) {
            this.setState({
                scrollSize: { x: e.clientWidth, y: e.clientHeight }
            });
        }
    }

    toggleChatView = () => {
        this.setState({
            showFullChat: !this.state.showFullChat
        });
    }

    componentDidMount() {
        let e = document.getElementById("roomArea");
        if (ResizeObserver) {
            this.resizeObserver = new ResizeObserver((entries) => {
                this.updateScrollSize();
            });
            this.resizeObserver.observe(e);

            this.updateScrollSize();
        }
        else {
            setInterval(() => this.updateScrollSize(), 3000);
        }
    }

    componentWillUnmount() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    render() {
        let style = {};
        let userAvatars = null;
        let roomItems = null;

        if (this.props.app && this.props.app.roomState) {
            let scrollPos = this.getScreenScrollPosition();

            userAvatars = this.props.app.roomState.users.map(u => (
                <UserAvatar key={u.userID} app={this.props.app} user={u} displayHelper={() => this} />
            ));

            roomItems = this.props.app.roomState.roomItems.map(item => (
                <UIRoomItem key={item.itemID} app={this.props.app} item={item} displayHelper={() => this} />
            ));

            style = {
                gridArea: "roomArea",
                backgroundImage: `url(${this.props.app.roomState.img})`,
                backgroundPosition: `${scrollPos.x}px ${scrollPos.y}px`,
            };
        }


        let connection = (this.props.app) ? null : (
            <DFSignIn.Connection app={this.props.app} handleConnect={this.props.handleConnect} handleDisconnect={this.props.handleDisconnect} />
        );

        const switchViewButton = this.props.app && this.props.app.roomState && (<button className="switchChatView" onClick={this.toggleChatView}>chat/room view</button>);

        return (
            <div id="roomArea" className="roomArea" onClick={e => this.onClick(e)} style={style}>
                {connection}
                {userAvatars}
                {roomItems}
                { !this.state.showFullChat && <ShortChatLog app={this.props.app} onToggleView={this.toggleChatView} />}
                { this.state.showFullChat && <FullChatLog app={this.props.app} onToggleView={this.toggleChatView} />}
                <AnnouncementArea app={this.props.app} />
                <RoomAlertArea app={this.props.app} />
                <CheerControls app={this.props.app} displayHelper={this}></CheerControls>
                {switchViewButton}

            </div>
        );
    }
}

class ChatArea extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: '' };
        this.handleChange = this.handleChange.bind(this);
    }

    handleClick() {
        if (!this.props.app) return;
        let sanitized = this.state.value.trim();
        if (sanitized.length < 1) return;
        sanitized = sanitized.substr(0, DF.ServerSettings.ChatMessageLengthMax);
        this.props.app.SendChatMessage(sanitized, null);
        this.state.value = '';
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            return this.handleClick();
        }
    }

    render() {
        if (!this.props.app) return null;
        return (
            <div id="chatArea" style={{ gridArea: "chatArea" }}>
                chat <input type="text" value={this.state.value} onChange={this.handleChange} onKeyDown={this.handleKeyDown} />
                <button onClick={this.handleClick.bind(this)}>send</button>
            </div>
        );
    }
}



class UpperRightControls extends React.Component {


    setVolumeVal = (v) => {
        let realVal = parseFloat(v.target.value) / 100;
        this.props.app.synth.masterGain = realVal;
        gStateChangeHandler.OnStateChange();
    }

    setPBRange = (v) => {
        this.props.app.pitchBendRange = v.target.value;
        gStateChangeHandler.OnStateChange();
    }

    onClickMute = () => {
        // this op takes a while so do async
        setTimeout(() => {
            this.props.app.synth.isMuted = !this.props.app.synth.isMuted;
            gStateChangeHandler.OnStateChange();
        }, 0);
    };


    componentDidMount() {
        DFUtils.stylizeRangeInput("volume", {
            bgNegColorSpec: "#044",
            negColorSpec: "#044",
            posColorSpec: "#044",
            bgPosColorSpec: "#044",
            zeroVal: 0,
        });
        DFUtils.stylizeRangeInput("pbrange", {
            bgNegColorSpec: "#044",
            negColorSpec: "#044",
            posColorSpec: "#044",
            bgPosColorSpec: "#044",
            zeroVal: 0,
        });
    }

    render() {

        return (
            <span className="topRightControls">
                <span className="pbContainer">
                    <input type="range" id="pbrange" name="pbrange" min="0" max="12" onChange={this.setPBRange} value={this.props.app.pitchBendRange} />
                    <label htmlFor="pbrange">PB range:{this.props.app.pitchBendRange}</label>
                </span>
                <span className="volumeContainer">
                    <input type="range" id="volume" name="volume" min="0" max="200" onChange={this.setVolumeVal} value={this.props.app.synth.masterGain * 100} disabled={this.props.app.synth.isMuted} />
                    <label htmlFor="volume">gain:{Math.trunc(this.props.app.synth.masterGain * 100)}</label>
                </span>
                <button className="muteButton" onClick={this.onClickMute}>{this.props.app.synth.isMuted ? "🔇" : "🔊"}</button>
            </span>

        );
    }

}


class RootArea extends React.Component {
    OnStateChange() {
        this.setState(this.state);
    }

    HandleConnect = (userName, color, google_access_token) => {
        let app = new DFApp.DigifuApp();

        // copied from ctor
        this.notesOn = []; // not part of state because it's pure jquery
        // notes on keeps a list of references to a note, since multiple people can have the same note playing it's important for tracking the note offs correctly.
        for (let i = 0; i < 128; ++i) {
            this.notesOn.push([]); // empty initially.
        }

        app.Connect(userName, color, () => this.OnStateChange(), this.handleNoteOn, this.handleNoteOff,
            this.handleUserAllNotesOff, this.handleAllNotesOff,
            this.handleUserLeave, this.HandlePleaseReconnect,
            this.HandleCheer, this.handleRoomWelcome, google_access_token);
        this.setState({ app });
    }

    handleRoomRef = (r) => {
        let a = 0;
    };

    handleRoomWelcome = () => {

        if (this.state.app.roomState.softwareVersion != DF.gDigifujamVersion) {
            alert("New version released; this page will reload...");
            location.reload();
            return;
        }

        this.handleAllNotesOff();

        // throw up a screen and it fades out, then we remove it.
        var room = document.getElementById("roomArea");
        var screen = document.createElement("div");
        screen.className = "screen";
        room.append(screen);

        setTimeout(() => {
            screen.parentNode.removeChild(screen);
        }, 1600);

        // elements which animate should be switched to non-animated versions
        $('.userAvatar').addClass('roomWelcomeNoTransition');
        $('.roomArea').addClass('roomWelcomeNoTransition');
        $('.roomItem').addClass('roomWelcomeNoTransition');

        this.OnStateChange();

        setTimeout(() => {
            $('.roomWelcomeNoTransition').removeClass('roomWelcomeNoTransition');
        }, 1);

    };

    HandleCheer = (data/*user, text x, y*/) => {

        let random = function (num) {
            return (Math.random() * num)
        };

        //alert(`user cheer ${JSON.stringify(data)}`);
        if (!this.roomRef || !this.roomRef.current) return;
        //createCheer(data.user, data.text, data.x, data.y, this.roomRef);
        //console.log(`createCheer(${text}, ${x}, ${y})`);
        var durx = random(2) + 1.5;
        var dury = random(2) + 1.5;
        var fontSize = random(6) + 24;
        var animX = Math.trunc(random(2));
        var animY = Math.trunc(random(2));
        var easeY = Math.trunc(random(2)) ? "ease-in" : "ease-out";
        var easyX = Math.trunc(random(2)) ? "ease-in" : "ease-out";

        let pos = this.roomRef.current.roomToScreenPosition({ x: data.x, y: data.y });

        let css = `
                animation: floatX${animX} ${durx}s ${easyX} forwards,
                floatY${animY} ${dury}s ${easeY} forwards,
                floatOpacity ${dury}s ease-out forwards;
                top:${pos.y}px;
                left:${pos.x}px;
                font-size:${fontSize}px;
                color:${data.user.color}
            `;

        var cheerContainer = document.getElementById("roomArea")
        var cheer = document.createElement("div");
        cheer.innerText = data.text;
        cheer.className = "cheer";
        cheer.style.cssText = css;
        cheerContainer.append(cheer);

        setTimeout(() => {
            cheer.parentNode.removeChild(cheer);
        }, Math.max(durx, dury) * 1000);
    }

    HandlePleaseReconnect = () => {
        this.state.app.Disconnect();
        this.setState({ app: null });
    }

    // called for "user clicked disconnect button"
    HandleDisconnect = () => {
        this.state.app.Disconnect();
        this.setState({ app: null });
    }

    handleNoteOn = (user, instrument, midiNote, velocity) => {
        $('#userAvatar' + user.userID).toggleClass('userAvatarActivityBump1').toggleClass('userAvatarActivityBump2');

        if (instrument.activityDisplay != "keyboard") return;

        this.notesOn[midiNote].push({ userID: user.userID, color: user.color });
        this.activityCount++;

        let k = $("#key_" + midiNote);
        if (!k.hasClass('active')) {
            k.addClass("active");
        }
        k.css("background-color", user.color);
    }

    removeUserNoteRef(userID, midiNote) {
        let refs = this.notesOn[midiNote];
        refs.removeIf(r => (r.userID == userID));

        let k = $("#key_" + midiNote);
        if (refs.length < 1) {
            k.removeClass("active");
            k.css("background-color", "");
            return;
        }
        k.css("background-color", refs[refs.length - 1].color);
    }

    handleNoteOff = (user, instrument, midiNote) => {
        if (instrument.activityDisplay != "keyboard") return;

        let refs = this.notesOn[midiNote];
        if (refs.length < 1) return;

        this.removeUserNoteRef(user.userID, midiNote);
    }

    handleUserAllNotesOff = (user, instrument) => {
        // remove all refs of this user
        this.notesOn.forEach((refs, midiNote) => {
            if (refs.length < 1) return;
            this.removeUserNoteRef(user.userID, midiNote);
        });
    };

    handleAllNotesOff = () => {

        // set all notes CSS
        for (let midiNote = 0; midiNote < 128; ++midiNote) {
            let k = $("#key_" + midiNote);
            k.removeClass("active");
            k.css("background-color", "");
        }

        this.notesOn = []; // not part of state because it's pure jquery
        // notes on keeps a list of references to a note, since multiple people can have the same note playing it's important for tracking the note offs correctly.
        for (let i = 0; i < 128; ++i) {
            this.notesOn.push([]); // empty initially.
        }
    };

    handleUserLeave = (userID) => {
        this.notesOn.forEach((ref, i) => {
            this.removeUserNoteRef(userID, i);
        });
    }

    toggleWideMode = () => {
        this.setState({ wideMode: !this.state.wideMode });
    };

    get observingInstrument() {
        return this.state.observingInstrument;
    }
    set observingInstrument(inst) {
        this.state.app.observeInstrument(inst); // this will send change notifications on remote param changes.
        this.setState({ observingInstrument: inst });
    }

    constructor(props) {
        super(props);
        this.state = {
            app: null,
            wideMode: false,
            observingInstrument: null,
        };

        window.DFStateChangeHandler = this;
        gStateChangeHandler = this;

        this.notesOn = []; // not part of state because it's pure jquery
        this.activityCount = 0;
        this.roomRef = React.createRef();

        // notes on keeps a list of references to a note, since multiple people can have the same note playing it's important for tracking the note offs correctly.
        for (let i = 0; i < 128; ++i) {
            this.notesOn.push([]); // empty initially.
        }
    }

    render() {
        let title = "(not connected)";
        if (this.state.app && this.state.app.roomState) {
            let activityTxt = "";
            if (window.gSpinners) {
                const spinnerName = "toggle10"; // arc
                const i = this.activityCount % window.gSpinners[spinnerName].frames.length;
                activityTxt = window.gSpinners[spinnerName].frames[i];
            }
            title = `${this.state.app.roomState.roomTitle} ${activityTxt} [${this.state.app.roomState.users.length}/${this.state.app.worldPopulation}]`;
        }
        if (document.title != title) {
            document.title = title;
        }

        if (this.state.wideMode && (!this.state.app || !this.state.app.myInstrument)) {
            setTimeout(() => {
                this.setState({ wideMode: false });
            }, 1);
        }



        return (
            <div id="grid-container" className={this.state.wideMode ? "wide" : undefined}>
                <div style={{ gridArea: "headerArea", textAlign: 'center' }} className="headerArea">
                    <span>
                        <a className="logoTxt" href={GetHomepage()}>7jam.io</a>
                        <a href="https://discord.gg/cKSF3Mg" target="_blank">
                            <svg className="socicon" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Discord icon</title><path d="M20.222 0c1.406 0 2.54 1.137 2.607 2.475V24l-2.677-2.273-1.47-1.338-1.604-1.398.67 2.205H3.71c-1.402 0-2.54-1.065-2.54-2.476V2.48C1.17 1.142 2.31.003 3.715.003h16.5L20.222 0zm-6.118 5.683h-.03l-.202.2c2.073.6 3.076 1.537 3.076 1.537-1.336-.668-2.54-1.002-3.744-1.137-.87-.135-1.74-.064-2.475 0h-.2c-.47 0-1.47.2-2.81.735-.467.203-.735.336-.735.336s1.002-1.002 3.21-1.537l-.135-.135s-1.672-.064-3.477 1.27c0 0-1.805 3.144-1.805 7.02 0 0 1 1.74 3.743 1.806 0 0 .4-.533.805-1.002-1.54-.468-2.14-1.404-2.14-1.404s.134.066.335.2h.06c.03 0 .044.015.06.03v.006c.016.016.03.03.06.03.33.136.66.27.93.4.466.202 1.065.403 1.8.536.93.135 1.996.2 3.21 0 .6-.135 1.2-.267 1.8-.535.39-.2.87-.4 1.397-.737 0 0-.6.936-2.205 1.404.33.466.795 1 .795 1 2.744-.06 3.81-1.8 3.87-1.726 0-3.87-1.815-7.02-1.815-7.02-1.635-1.214-3.165-1.26-3.435-1.26l.056-.02zm.168 4.413c.703 0 1.27.6 1.27 1.335 0 .74-.57 1.34-1.27 1.34-.7 0-1.27-.6-1.27-1.334.002-.74.573-1.338 1.27-1.338zm-4.543 0c.7 0 1.266.6 1.266 1.335 0 .74-.57 1.34-1.27 1.34-.7 0-1.27-.6-1.27-1.334 0-.74.57-1.338 1.27-1.338z" /></svg>
                        </a>
                        <a href="https://twitter.com/tenfour2" target="_blank">
                            <svg className="socicon" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>twitter.com/tenfour2</title><path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.959-2.173-1.559-3.591-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z" /></svg>
                        </a>
                        <a target="_blank" href="https://github.com/thenfour/digifujam">
                            <svg className="socicon" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub icon</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                        </a>
                    </span>
                    {this.state.app && this.state.app.synth && <UpperRightControls app={this.state.app}></UpperRightControls>}
                </div>
                <DFPiano.PianoArea app={this.state.app} />
                <ChatArea app={this.state.app} />
                <RoomArea app={this.state.app} handleConnect={this.HandleConnect}
                    handleDisconnect={() => this.HandleDisconnect()}
                    ref={this.roomRef} />
                <RightArea app={this.state.app} handleConnect={this.HandleConnect} handleDisconnect={() => this.HandleDisconnect()} toggleWideMode={this.toggleWideMode} isWideMode={this.state.wideMode} />
                <LeftArea app={this.state.app} handleConnect={this.HandleConnect} handleDisconnect={() => this.HandleDisconnect()} />

            </div>
        );
    }
}

module.exports = {
    AnnouncementArea,
    BPMControls,
    ChatArea,
    CheerControls,
    FullChatLog,
    InstButtonsParam,
    InstCbxParam,
    InstDropdownParam,
    InstFloatParam,
    InstIntParam,
    InstrumentList,
    InstrumentParamGroup,
    InstrumentParams,
    InstrumentPreset,
    InstrumentPresetList,
    InstTextParam,
    LeftArea,
    MidiCCMappingInfo,
    ParamMappingBox,
    RightArea,
    RoomAlertArea,
    RoomArea,
    RootArea,
    ShortChatLog,
    UIAudioVisualizationRoomItem,
    UIRoomItem,
    UpperRightControls,
    UserAvatar,
    UserList,
    UserState,
    WorldStatus,
};

