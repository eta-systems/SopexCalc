/* 
LT3652 Power Tracking 2A Battery Charger for Solar Power 
https://www.analog.com/media/en/technical-documentation/data-sheets/3652fe.pdf

TPS54331 3-A, 28-V Input, Step Down DC-DC Converter.
https://www.ti.com/lit/ds/symlink/tps54331.pdf
*/

/* add Event Listeners for Calculate Buttons */
var btnCalcRfb   = document.getElementById("btnRfb");
var btnCalcSense = document.getElementById("btnSens");
var btnCalcVin   = document.getElementById("btnVin");
var btnSetPreset = document.getElementById("btnPreset");
var btnCalcVlockout = document.getElementById("btnVlockout");

btnCalcRfb.addEventListener("click", calcRfb);
btnCalcSense.addEventListener("click", calcRsens);
btnCalcVin.addEventListener("click", calcVin);
btnSetPreset.addEventListener("click", applyPreset);
btnCalcVlockout.addEventListener("click", calcLockout);

var vBatField=document.getElementById("vBatFlt");
var IfbField=document.getElementById("Ifb");
var iChgField=document.getElementById("iChg");
var vInField=document.getElementById("vInMin");
var vStartField=document.getElementById("vInStart");
var vStopField=document.getElementById("vInStop");

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

function applyPreset()
{
	/*  @niklaus leisibach
	ich würd als ausschaltschwelle 30% Restkapatzität nehmen. Einschaltschwelle sobalt 50% Geladen
	*/
	var batteryIdx = document.getElementById("batteryPresets").selectedIndex;
	var iFb=10;
	var Vinmin=10.9;

	var vBatFlt=13.5;
	var Ichgmax=0.1;

	var vStart=4.0;
	var vStop=1.0;

	switch(batteryIdx){
		case 1: // 12V lead acid
			vBatFlt=14.9;
			Ichgmax=2.88;
			break;
		case 2: // Li-Ion
			vBatFlt=8.2;
			Ichgmax=0.1;
			break;
		case 3: // 18650
			vBatFlt=8.4;
			Ichgmax=1.0;
			break;
		default:
	}

	// LT3652 only supports up to 2.0A
	if(Ichgmax > 2.0){
		Ichgmax = 2.0
	}

	document.getElementById("vBatFlt").value = vBatFlt;
	document.getElementById("Ifb").value     = iFb;
	document.getElementById("iChg").value    = Ichgmax;
	document.getElementById("vInMin").value  = Vinmin;
	document.getElementById("vInStart").value  = vStart;
	document.getElementById("vInStop").value  = vStop;
	calc();
}

function calc()
{
	calcRfb();
	calcRsens();
	calcVin();
	calcLockout();
}

function calcLockout()
{
	vstart=vStartField.value;
	vstop=vStopField.value;
	ven=1.25;
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
	/* Datasheet: page 16 */
	vin=vInField.value;
	var RinRelation=(parseFloat(vin)/2.7)-1;
	/* TOD: Hardcoded Value Rin1 O*/
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
	/* Datasheet: page 8 */
	ichg=iChgField.value;
	var Rsens=0.1/parseFloat(ichg);

	resistor = getResistor(Rsens);
	katex.render("\\;"+resistor[0]+"\\;", valueRsens);
	katex.render(resistor[1]+"\\Omega", unitOhmSens);
}

function calcRfb()
{
	/* Datasheet: page 14 (2 resistors) */
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
	var Rfb3=0;
	var eValue=0;

	resistor = getResistor(Rfb1);
	katex.render("\\;"+resistor[0]+"\\;", valueRfb1);
	katex.render(resistor[1]+"\\Omega", unitRfb1);

	resistor = getResistor(Rfb2);
	katex.render("\\;"+resistor[0]+"\\;", valueRfb2);
	katex.render(resistor[1]+"\\Omega", unitRfb2);

	/*
	// only used if using a 3 resistor feedback network
	resistor = getResistor(Rfb3);
	katex.render("\\;"+resistor[0]+"\\;", valueRfb3);
	katex.render(resistor[1]+"\\Omega", unitRfb3);
	*/
}

