/* 
LT3652 Power Tracking 2A Battery Charger for Solar Power 
https://www.analog.com/media/en/technical-documentation/data-sheets/3652fe.pdf

TPS54331 3-A, 28-V Input, Step Down DC-DC Converter.
https://www.ti.com/lit/ds/symlink/tps54331.pdf

NCP380 Adjustable Current‐Limiting Power‐Distribution Switch
https://www.onsemi.com/pub/Collateral/NCP380-D.PDF
*/

/* add Event Listeners for "Calculate" Buttons */
var btnCalcRfb   = document.getElementById("btnRfb");
var btnCalcSense = document.getElementById("btnSens");
var btnCalcVin   = document.getElementById("btnVin");
var btnSetPreset = document.getElementById("btnPreset");
var btnCalcVlockout = document.getElementById("btnVlockout");
var btnCalcVout = document.getElementById("btnVout");
var btnCalcIlim = document.getElementById("btnIlim");

btnCalcRfb.addEventListener("click", calcRfb);
btnCalcSense.addEventListener("click", calcRsens);
btnCalcVin.addEventListener("click", calcVin);
btnSetPreset.addEventListener("click", applyPreset);
btnCalcVlockout.addEventListener("click", calcLockout);
btnCalcVout.addEventListener("click", calcVout);
btnCalcIlim.addEventListener("click", calcIlim);

/* Input Fields to get user values */
var vBatField=document.getElementById("vBatFlt");
var IfbField=document.getElementById("Ifb");
var iChgField=document.getElementById("iChg");
var vInField=document.getElementById("vInMin");
var vStartField=document.getElementById("vInStart");
var vStopField=document.getElementById("vInStop");
var vOutField=document.getElementById("vOut");
var iLimField=document.getElementById("iLim");

var resistor_series = 0;

var e12 = [0.82, 1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2, 
	10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82, 
	100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820, 1000];

var e24 = [0.91, 1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
	3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1, 
	10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 
	33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91, 
	100, 110, 120, 130, 150, 160, 180, 200, 220, 240, 270, 300, 
	330, 360, 390, 430, 470, 510, 560, 620, 680, 750, 820, 910, 1000];

/* finds closest E12 / E24 value 
- depends on global variable: resistor_series */
function getResistor(value)
{
	var kat="";
	var res=0.0;
	if(!isNaN(value))
	{
		if(value < 1.0){
			value=value*1000;
			kat="m";
		} else if(value >= 1000){
			value=value/1000;
			if(value >= 1000){
				value=value/1000;
				kat="M";
			} else {
				kat="k";
			}
		} else {
			kat="";
		}

		if(resistor_series == 12){
			res = getE12Value(value);
		} else if(resistor_series == 24){
			res = getE24Value(value);
		} else {
			res = value.toPrecision(4)
		}
	}
	return [res, kat];
}

function eSeriesHandler(radio)
{
	resistor_series = radio.value;
	calc();
}

function getE12Value(num)
{
	return closest(e12, num);
}

function getE24Value(num)
{
	return closest(e24, num);
}

function closest(array, num)
{
	var i = 0;
	var minDiff = 1000;
	var ans;
	for (i in array) {
		var m = Math.abs(num - array[i]);
		if (m < minDiff) {
			minDiff = m;
			ans = array[i];
		}
	}
	return ans;
}

/* applies a preset from the battery dropdown to some input fields of the document */
function applyPreset()
{
	var batteryIdx = document.getElementById("batteryPresets").selectedIndex;
	var iFb=10;
	var Vinmin=10.9;

	var vBatFlt=13.5;
	var Ichgmax=0.1;

	var vStart=4.0;
	var vStop=1.0;
	var vZeroCapacity = 1;  // Voltage at empty battery

	switch(batteryIdx){
		case 1: // 12V lead acid
			vBatFlt=14.9;
			vZeroCapacity = 11;
			Ichgmax=2.88;
			break;
		case 2: // Li-Ion
			vBatFlt=8.2;
			vZeroCapacity=7.1
			Ichgmax=0.1;
			break;
		case 3: // 18650
			vBatFlt=8.4;
			vZeroCapacity=7.2;
			Ichgmax=1.0;
			break;
		default:
	}
	/*  @niklaus leisibach
	ich würd als ausschaltschwelle 30% Restkapatzität nehmen. Einschaltschwelle sobalt 50% Geladen
	*/
	// assume linear charging curve
	vStop = (vBatFlt-vZeroCapacity)*0.3 + vZeroCapacity;   // 30%
	vStart = (vBatFlt-vZeroCapacity)*0.5 + vZeroCapacity;  // 50%

	// LT3652 only supports up to 2.0A
	if(Ichgmax > 2.0){
		Ichgmax = 2.0
	}

	// Rounding: https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
	document.getElementById("vBatFlt").value  = Math.round((vBatFlt +Number.EPSILON)*100)/100;
	document.getElementById("Ifb").value      = Math.round((iFb     +Number.EPSILON)*100)/100;
	document.getElementById("iChg").value     = Math.round((Ichgmax +Number.EPSILON)*100)/100;
	document.getElementById("vInMin").value   = Math.round((Vinmin  +Number.EPSILON)*100)/100;
	document.getElementById("vInStart").value = Math.round((vStart  +Number.EPSILON)*100)/100;
	document.getElementById("vInStop").value  = Math.round((vStop   +Number.EPSILON)*100)/100;
	
	/* Todo: Output Voltage Preset */
	// document.getElementById("vOut").value  = vOut;
	calc();
}

function calc()
{
	calcRfb();
	calcRsens();
	calcVin();
	calcLockout();
	calcVout();
	calcIlim();
}

function calcIlim()
{
	/* https://www.onsemi.com/pub/Collateral/NCP380-D.PDF */
	/* Datasheet: page 17 / eq. 5 */
	ILIM=parseFloat(iLimField.value);
	Rlim = -5.2959 * Math.pow(ILIM,5) + 45.256 * Math.pow(ILIM,4) - 155.25 * Math.pow(ILIM,3) + 274.39 * Math.pow(ILIM,2) - 267.6 * ILIM + 134.21;
	Rlim = Rlim * 1000;

	resistor = getResistor(Rlim);
	katex.render("\\;"+resistor[0]+"\\;", valueRlim);
	katex.render(resistor[1]+"\\Omega", unitOhmRlim);
}

function calcVout()
{
	vout=parseFloat(vOutField.value);
	/* Datasheet: page 15 */
	var Vref=0.8;
	var R5=10000;
	var R6=(R5*Vref)/(vout-Vref);

	resistor = getResistor(R5);
	katex.render("\\;"+resistor[0]+"\\;", valueR24);
	katex.render(resistor[1]+"\\Omega", unitOhmR24);

	resistor = getResistor(R6);
	katex.render("\\;"+resistor[0]+"\\;", valueR25);
	katex.render(resistor[1]+"\\Omega", unitOhmR25);

}

function calcLockout()
{
	vstart=parseFloat(vStartField.value);
	vstop=parseFloat(vStopField.value);
	ven=1.25;
	/* https://www.ti.com/lit/ds/symlink/tps54331.pdf */
	/* Datasheet: page 11 */
	Ren1=(vstart-vstop)/0.000003;  // 3uA
	Ren2=ven/((vstart-ven)/Ren1+0.000001);

	resistor = getResistor(Ren1);
	katex.render("\\;"+resistor[0]+"\\;", valueRen1);
	katex.render(resistor[1]+"\\Omega", unitOhmRen1);

	resistor = getResistor(Ren2);
	katex.render("\\;"+resistor[0]+"\\;", valueRen2);
	katex.render(resistor[1]+"\\Omega", unitOhmRen2);
}

function calcVin()
{
	/* https://www.analog.com/media/en/technical-documentation/data-sheets/3652fe.pdf */
	/* Datasheet: page 16 */
	vin=parseFloat(vInField.value);
	var RinRelation=(vin/2.7)-1;
	/* TODO: Hardcoded Value Rin1 */
	/* algorithm to select best two resistors for given ratio */
	var Rin1=100000;
	var Rin2=Rin1/RinRelation;

	resistor = getResistor(Rin1);
	katex.render("\\;"+resistor[0]+"\\;", valueRin1);
	katex.render(resistor[1]+"\\Omega", unitOhmRin1);

	resistor = getResistor(Rin2);
	katex.render("\\;"+resistor[0]+"\\;", valueRin2);
	katex.render(resistor[1]+"\\Omega", unitOhmRin2);
}

function calcRsens()
{
	/* https://www.analog.com/media/en/technical-documentation/data-sheets/3652fe.pdf */
	/* Datasheet: page 8 */
	ichg=iChgField.value;
	var Rsens=0.1/parseFloat(ichg);

	resistor = getResistor(Rsens);
	katex.render("\\;"+resistor[0]+"\\;", valueRsens);
	katex.render(resistor[1]+"\\Omega", unitOhmSens);
}

function calcRfb()
{
	/* https://www.analog.com/media/en/technical-documentation/data-sheets/3652fe.pdf */
	/* Datasheet: page 14/15 (2 resistors) */
	/* Datasheet: page 15 (3 resistors) */
	vBat=vBatField.value;
	ifb=IfbField.value/1000000;  // microamps

	/* 3 resistor feedback network */
	// var RfbRelation = 3.3/(parseFloat(vBat)-3.3);
	// var Rfb2=3.3/parseFloat(ifb);
	// var Rfb1=Rfb2/RfbRelation;
	// var RfbParallel=1/( 1/(Rfb1) + 1/(Rfb2) );
	// var Rfb3=250000-RfbParallel;

	/* 2 resistors feedback network */
	var Rfb1=parseFloat(vBat)*2.5*100000/3.3;
	var Rfb2=Rfb1*(2.5*100000)/(Rfb1-(2.5*100000));
	var eValue=0;

	resistor = getResistor(Rfb1);
	katex.render("\\;"+resistor[0]+"\\;", valueRfb1);
	katex.render(resistor[1]+"\\Omega", unitRfb1);

	resistor = getResistor(Rfb2);
	katex.render("\\;"+resistor[0]+"\\;", valueRfb2);
	katex.render(resistor[1]+"\\Omega", unitRfb2);

	/*
	// only used if using a 3 resistor feedback network
	*/
	var Rfb3=0;   // hardcoded
	resistor = getResistor(Rfb3);
	katex.render("\\;"+resistor[0]+"\\;", valueRfb3);
	katex.render(resistor[1]+"\\Omega", unitRfb3);
}

