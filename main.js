function getTimetable() {
    const timetableRows = document.querySelectorAll(".print-nobreak > div:not(:first-child) > div:not(:first-child) > div > div:not(:first-child) > div > div");
    const timetableDR = document.querySelectorAll(".print-nobreak > div:not(:first-child) > div:not(:first-child) > div:first-child > div > div");
    const talanazido = document.querySelectorAll(".print-nobreak > div > div:first-child > div:not(first-child) > div > div > span:not(:first-child)");
    let valueCounter = 3;
    timetableDR.forEach((day, index) => {//Napok beállítása
        if (index < 2) {
            day.setAttribute('value', index + 1);
        } else if (day.textContent.trim() !== "") {
            day.setAttribute('value', valueCounter);
            if (valueCounter === 5) {
                valueCounter = 1;
            } else {
                valueCounter++;
            }
        }
    });
    
    var osztaly = document.querySelector(".print-font-resizable").textContent;
    console.log(osztaly);
    let oraadatszam = 0; // Ez a edupage anti dump agyalása miatt kell, mert minden egymás mellett van divekben
    let timetableData = [];
    let ora = {day: "", csoport: "nincs", tanar: "", tanterem: "", tantargy: "", rendes: "", cstipus: "", color: "", hossz: ""};

    timetableRows.forEach((row) => {
        if(row.textContent.trim() !== "") {
            if(!isNaN(osztaly[0])) {//Ha van az osztály elsőkarakterében szám, ezzel ellenőrizve hogy nem tanári órarendet nézzünk
                oraadatszam++;
                if(row.style.height === "104px") {//Ha nem csoportos az óra
                    if(oraadatszam === 1) ora.tanterem = row.textContent;
                    if(oraadatszam === 2) ora.tanar = row.textContent;
                    if(oraadatszam === 3) ora.tantargy = tantargyak(row.textContent, ora.csoport, ora.tanar, osztaly);
                    if(oraadatszam === 3) {//Sajnos vannak olyan nem csoportos órák, aminek 4 adata van, így érvénytelenül exportálodnak az adatok. Majd később megoldom.
                        oraadatszam = 0;
                        ora.rendes = rendes(row).hossz;
                        ora.cstipus = hanycsoport(row);
                        ora.day = iskolanap(parseInt(row.parentElement.getAttribute("value")));
                        ora.color = row.children[0] !== undefined ? row.children[0].getAttribute("style").replace("background-color: ", "").replace("background: ", "") : "LINEAR GRADIENT Háttér";
                        ora.hossz = hanyadikora(hanycsoport(row), iskolanap(row.parentElement.getAttribute("value")), rendes(row));
                        timetableData.push({ ...ora });
                        ora = { day: "", csoport: "nincs", tanar: "", tantargy: "", tanterem: "", rendes: "", cstipus: "", color: "", hossz: ""};
                    }
                } else {//Hogyha nem egyenlő 104px-el akkor 999%, hogy ez csoportos óra
                    if(oraadatszam === 1) ora.csoport = row.textContent;
                    if(oraadatszam === 2) ora.tanterem = row.textContent;
                    if(oraadatszam === 3) ora.tanar = row.textContent;
                    if(oraadatszam === 4) ora.tantargy = tantargyak(row.textContent, ora.csoport, ora.tanar, osztaly);
                    if(oraadatszam === 4) {
                        oraadatszam = 0;
                        ora.rendes = rendes(row).hossz;
                        ora.cstipus = hanycsoport(row);
                        ora.day = iskolanap(parseInt(row.parentElement.getAttribute("value")));
                        ora.color = row.children[0] !== undefined ? row.children[0].getAttribute("style").replace("background-color: ", "").replace("background: ", "") : "LINEAR GRADIENT Háttér";
                        ora.hossz = hanyadikora(hanycsoport(row), iskolanap(row.parentElement.getAttribute("value")), rendes(row));
                        timetableData.push({ ...ora });
                        ora = { day: "", csoport: "nincs", tanar: "", tantargy: "", tanterem: "", rendes: "", cstipus: "", color: "", hossz: ""};
                    }
                }
            }
        } else {
        }
    });
    if(oraadatszam > 0) timetableData.push({ ...ora });
    return { osztaly, timetableData }; //Óra adatok visszaküldése
}

function iskolanap(index) {//Napok
    return ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"][index-1];
}

function rendes(row) {//Meddig tart egy adott óra
    let pxcut = `${row.style.width}`.split("px")[0];
    if(pxcut >= 150 && pxcut <= 157) return { hossz: "egyoras", szam: 1};
    if(pxcut >= 308 && pxcut <= 317) return { hossz: "duplaoras", szam: 2};
    if(pxcut >= 470 && pxcut <= 475) return { hossz: "triplaoras", szam: 3};
    if(pxcut >= 625 && pxcut <= 635) return { hossz: "negyoras", szam: 4};
    if(pxcut >= 785 && pxcut <= 792) return { hossz: "otoras", szam: 5};
}

function hanycsoport(row) {//Hány csoportból áll az óra, ha külön órák vannak
    let pxcut = `${row.style.height}`.split("px")[0];
    if(pxcut >= 98 && pxcut <= 107) return "nincscsoport";
    if(pxcut >= 48 && pxcut <= 53 || pxcut >= 65 && pxcut <= 70) return "2csoport";
    if(pxcut >= 30 && pxcut <= 35) return "3csoport";
    if(pxcut >= 22 && pxcut <= 27) return "4csoport";
}

let oraszam = 0;
let csoportszam = 1;
let prevDay = "Hétfő";
function hanyadikora(cstipus, nap, rendes) {//Ezzel fixálni tudom azt hogy a csoportos órákat és/vagy a 1 óránál több órákat külön óránként kezelje
    const ido = [
        "Hibaa-Hibaa",
        "07:50-08:35",
        "08:40-09:25",
        "09:35-10:20",
        "10:30-11:15",
        "11:25-12:10",
        "12:15-13:00",
        "13:05-13:50",
        "13:55-14:40",
        "14:45-15:30"
    ];

    if(prevDay !== nap) { //Ha új nap jön, akkor az óra legyen 0, mert minden napnál külön kell számolni.
        prevDay = nap;
        oraszam = 0;
    }

    if(cstipus === "nincscsoport") {//Ha nincs csoport, akkor ne rakja a háttérbe az amúgy sem létező (mert csak 1 csoport van, ha ez a feltétel igaz) csoportokat
        oraszam++;
        if(rendes.szam !== 1) {//Ha több órás lenne, akkor tudja meg, hogy hány órás, és hogy mettől meddig tart
            let startInd = `${ido[oraszam]}`.slice(0,5);
            let endInd = `${ido[oraszam+rendes.szam-1]}`.slice(6,11);
            oraszam += rendes.szam-1;
            //console.log(csoportszam + ` NINCS CSOPORT Óraszám: ${oraszam} | Óra hossz: ${startInd}-${endInd} | Nap: ${nap}`);
            csoportszam = 1;
            return `${startInd}-${endInd} ${oraszam-rendes.szam+1}-${oraszam}`;//1 óránál hoszabb óra kezdete és vége
        } else if(rendes.szam === 1) {//Ha 1 órás, akkor nincs is nagyon semmi teendő.
            //console.log(csoportszam + ` NINCS CSOPORT Óraszám: ${oraszam} | Óra hossz: ${ido[oraszam]} | Nap: ${nap}`);
            csoportszam = 1;
            return `${ido[oraszam]} ${oraszam}`;
        }
    } else {//Ha van csoport
        //console.log(csoportszam + ` ${cstipus[0]}`);
        if(csoportszam == parseInt(cstipus[0])) {//Ha a csoportszam = a csoportszámal pl: 2csoport -> 2, akkor végezze el a megfelelő műveletet
            if(rendes.szam !== 1) {//Ha több órás lenne, akkor tudja meg, hogy hány órás, és hogy mettől meddig tart
                let startInd = `${ido[oraszam]}`.slice(0,5);
                let endInd = `${ido[oraszam+rendes.szam-1]}`.slice(6,11);
                oraszam += rendes.szam-1;
                //console.log(csoportszam + ` VAN CSOPORT Óraszám: ${oraszam} Óra hossz: ${startInd}-${endInd} | Nap: ${nap}`);
                csoportszam = 1;
                return `${startInd}-${endInd} ${oraszam-rendes.szam+1}-${oraszam}`;//1 óránál hoszabb óra kezdete és vége
            }else if(rendes.szam === 1) {//Ha 1 órás, akkor nincs is nagyon semmi teendő.
                //console.log(csoportszam + ` VAN CSOPORT Óraszám: ${oraszam} Óra hossz: ${ido[oraszam]} | Nap: ${nap}`);
                csoportszam = 1;
                return `${ido[oraszam]} ${oraszam}`;
            }
        } else {//Ha csoportszam nem = 2csoport -> 2-vel, akkor valószínűleg új csoportot számol, azaz 1 órával több lesz, mert ez egy új óra, és egy órába számolja a tantárgyakat
            if(csoportszam == 1) oraszam++;
            csoportszam++;
        }
    }
    /*Ez itt azért kell mert ha több csoport van pl 3 csoport, akkor ezt írná ki:
    9.A n;9.A nyelv;Szerda;Német nyelv;PLB;F004 (9.A);CSOPORT;egyoras;3csoport;09:35-11:15 4; -> 09:35-11:15 4
    9.A n;9.A nyelv;Szerda;Német nyelv;CsG;köny;CSOPORT;egyoras;3csoport;09:35-11:15 4; -> 09:35-11:15 4
    9.A n;9.A nyelv;Szerda;Kínai nyelv;CX;K;CSOPORT;egyoras;3csoport;10:30-11:15 4; -> 10:30-11:15 4
    De mivel ez 3 csoport és egy időben van, ezért az első kettőnek olyannak kell lennie mint a harmadik óra idejének. Azaz mind3 az 10:30-11:15
    */
    let startInd = `${ido[oraszam]}`.slice(0,5);
    let endInd = `${ido[oraszam+rendes.szam-1]}`.slice(6,11);
    return `${startInd}-${endInd} ${oraszam}`;
    /*Valamiért nem jó teljesen mert:
    9.A n;9.A nyelv;Szerda;Angol nyelv;EK;F002 (12.A);9.A angol1 A;duplaoras;2csoport;12:15-13:50 6;rgb(245, 154, 131); --> 6
    9.A n;9.A nyelv;Szerda;Angol nyelv;NFM;F004 (9.A);9.A angol1 B;duplaoras;2csoport;12:15-13:50 6-7;rgb(128, 255, 224); --> 6-7
    A kezdő óra mindkettőnél 6 viszont a végét már csak a másik mutatja (2 órás ez a 2csoportos óra)
    Mind a kettőnél 6-7 kell lennie. Nincs is kedvem btw inkább majd átírom a kiírt adatokat mert így is másfélóra mire rendbe teszem az adatbázist (köszi edupage)
    */
}

//Gomb integrálása a weboldalba
const button = document.createElement("button");
button.style.cssText = "width: 70px; height: 50px;z-index: 100; position:absolute;top: 0;right: 200px";
button.textContent = "ALMAAA";
button.addEventListener("click", ()=>{
    let timetable = getTimetable().timetableData;
    let osztaly = getTimetable().osztaly;
    let osztalyid = "";
    if(isNaN(osztaly[0])) {//Ha nem szám, akkor fix hogy tanári órarend
        osztalyid = osztaly;
        for(let i=0;i<=timetable.length; i++) {//Exportálás consoleon keresztül
            console.log(`${timetable[i].tanar};${timetable[i].day == undefined ? "aaaaaaaa" : timetable[i].day};${timetable[i].tantargy};${timetable[i].tanterem};${timetable[i].csoport};${timetable[i].rendes};${timetable[i].cstipus};${timetable[i].hossz};${timetable[i].color}`);
        } 
    } else {//Ha egyik osztálynak órarendjét nézzük
        osztalyid = osztaly.slice(0, osztaly.indexOf(".")+4);
        for(let i=0;i<=timetable.length; i++) {//Exportálás consoleon keresztül
            console.log(`${osztalyid};${osztaly};${timetable[i].day == undefined ? "aaaaaaaa" : timetable[i].day};${timetable[i].tantargy};${timetable[i].tanar};${timetable[i].tanterem};${timetable[i].csoport};${timetable[i].rendes};${timetable[i].cstipus};${timetable[i].hossz};${timetable[i].color}`);
        }
    } 
});
document.body.appendChild(button);

function tantargyak(ora, csoport, tanar, osztaly) {//Tantárgyak, van amit nem érzékel azaz "Nincs benne a listában" ír ki, de nem érdekel.
    const tanorak = {
        "Bio": "Biológia",
        "Ké": "Kémia",
        "MaNy": "Magyar nyelv",
        "TsNe": "Testnevelés",
        "Dk": "Digitális kultúra",
        "Mat": "Matematika",
        "An": "Angol nyelv",
        "Tört": "Történelem",
        "Nm": "Német nyelv",
        "Nt": "Német tehetséggondozás",
        "MaIr": "Magyar irodalom",
        "At": "Angol tehetséggondozás",
        "Fdr": "Földrajz",
        "Én": "Ének-zene",
        "KnNy": "Kínai nyelv",
        "Fr": "Francia nyelv",
        "Has": "Honvédelmi alapismeretek szakkör",
        "Fiz": "Fizika",
        "Oszt": "Osztályfőnöki",
        "V": "Vizuális-kultúra",
        "Tééta": "Termelési, értékesítési és turisztikai alapismeretek",
        "Iav": "IKT a vendéglátásban",
        "Kktt": "Kötelező komplex természettudományos tantárgy",
        "Amunka": "A munka világa",
        "Komm": "Kommunikáció",
        "Da": "Digitális alkalmazások",
        "Géja": "Gazdasági és jogi alapismeretek",
        "Játszem": "Játékos személyiségfejlesztés",
        "Élped": "Élménypedagógia",
        "létaI": "Informatikai és távközlési alapok I.",
        "ék": "énekkar",
        "PedGyak": "Pedagógiai gyakorlat",
        "IpI": "IKT projektmunka I.",
        "Zn": "Zenei nevelés",
        "Pa": "Programozási alapok",
        "Att": "A tanulás tanulása",
        "GI": "Gimnasztika I.",
        "Anaism": "Anatómiai-élettani ismeretek",
        "Stéö": "Speciális testnevelés és önvédelem",
        "Ka": "Közszolgálati alapismeretek",
        "At": "Angol tehetséggondozás",
        "Pénzvállism": "Pénzügyi és vállalkozói ismeretek",
        "FaI": "Földméréstani alapismeretek I.",
        "Tv": "Természettudományos vizsgálatok",
        "Kal": "Környezetvédelmi alapismeretek I.",
        "Vma": "Vállalkozások működtetésének alapismeretei",
        "Egtan": "Egészségtan",
        "Dkap": "Digitális kultúra/Ikt a pedagógiában",
        "Pszi": "Pszichológia",
        "Tm": "Testnevelés/Mozgáskultúra",
        "Ég": "Értékteremtő gyermeknevelés",
        "Pséka": "Pszichológiai, szociológiai és kriminológiai alapismeretek",
        "Kg": "Kommunikációs gyakorlatok",
        "Ki": "Kommunikációs ismeretek",
        "Termtud": "Természettudomány",
        "M": "Művészetek",
        "Bri": "Belügyi rendészeti ismeretek",
        "EdII": "Edzéselmélet II.",
        "Mg": "Munkaerő-gazdálkodás",
        "ügykom": "Ügyfélszolgálati kommunikáció",
        "Projekt": "Projektóra",
        "Dokszerk": "Dokumentumszerkesztés",
        "Szövszám": "Szövegbevitel számítógépen",
        "Üzletadm": "Üzleti adminisztráció",
        "Adóism": "Adózási ismeretek",
        "Esny": "Elsősegélynyújtás",
        "Teréltan": "Terhelésélettan",
        "Sportszervism": "Sportszervezési ismeretek",
        "Titügy": "Titkári ügyintézés",
        "Kisésközgazd": "Kis és középvállalkozások gazdálkodása",
        "GII": "Gimnasztika II.",
        "Kommtit": "Kommunikáció a titkári munkában",
        "Spala": "Sportági alapok",
        "Haf": "Honvédelmi alapismeretek fakultáció",
        "Óg": "Óvodai gyakorlat",
        "Óvonev": "Óvodai nevelés",
        "Gyerir": "Gyermekirodalom",
        "Gék": "Gyermek- és kamaszirodalom",
        "Gée": "Gondozás és egészségnevelés",
        "Aga": "A gyógypedagógia alapjai",
        "Krealk": "Kreatív alkotás",
        "AI": "Adatbázis-kezelés I.",
        "HI": "Hálózatok I.",
        "Sa": "Szakmai angol",
        "Digkomésgép": "Digitális kommunikáció és gépírás",
        "Önv": "Önvédelem",
        "Lövész": "Lövészet",
        "11f1": "11fakultáció 1",
        "11f2": "11fakultáció 2",
        "11f3": "11fakultáció 3",
        "11f4": "11fakultáció 4",
        "12f1": "12fakultáció 1",
        "12f2": "12fakultáció 2",
        "12f3": "12fakultáció 3",
        "12f4": "12fakultáció 4",
        "Ái": "Állampolgári ismeretek",
        "Césó": "Csoportos és speciális óratípusok",
        "Fa": "Funkcionális anatómia",
        "Ped": "Pedagógia",
        "Pénznyíl": "Pénzforgalmi nyílvántartások",
        "Üzletadm": "Üzleti adminisztráció",
        "Anyagism": "Anyagismeret",
        "Jogszakism": "Jogi- és szakigazgatási ismeretek",
        "Matér": "Matematika érettségi előkészítő",
        "Séf": "Szerverek és felhőszolgáltatások",
        "Mnée": "Magyar nyelv érettségi előkészítő",
        "Tée": "Történelem érettségi előkészítő",
        "KöralapII": "Környezetvédelmi alapismeretek II.",
        "Erőállfej": "Erő és állóképesség fejlesztés",
        "Ji-Rt": "Jogi ismeretek - Rendészeti technikus",
        "Sév": "Személy- és vagyonvédelem",
        "Projekt": "Projektóra",
        "Ümat": "Üzleti menedzsment a turizmusban",
        "P": "Portfólió készítés",
        "Kt": "Környezetvédelmi technológiák",
        "Tép": "Turizmusmarketing és protokoll",
        "Kvmérés": "Környezetvédelmi mérések",
        "Min": "Munkavállalói idegen nyelv",
        "Bv": "Biológiai vizsgálatok",
        "Ka": "Könyvvezetési alapismeretek",
        //Hibás tantárgy adatok átalakítása
        "*97": "Magyar felzárkóztató",
        "*103": "Matematika felzárkóztató"

    };//Manuálisan kell hozzáadni az órákat:(
    if(osztaly.includes("11.E") || osztaly.includes("12.E") || osztaly.includes("13.E")) {
        tanorak["IpI"] = "IKT projektmunka II.";
    }
    if(tanar === "GYL" && ora === "EI") {
        tanorak["EI"] = "Edzésprogramok I."
    } else if(tanar === "CsB" && ora === "EI") {
        tanorak["EI"] = "Edzésprogramok II.";
    } else {
        tanorak["EI"] = "Edzéselmélet I.";
    }
    if(tanar === "LJ" && ora === "Ha") {
        tanorak["Ha"] = "Hidrológia alapjai";
    } else {
        tanorak["Ha"] = "Honvédelmi alapismeretek";
    }
    if (csoport.includes("matek fel")) {
        tanorak["Mf"] = "Matematika felzárkóztató";
    } else {
        tanorak["Mf"] = "Magyar felzárkóztató";
    }
    if(osztaly.includes("13.C")) {
        tanorak["Ma"] = "Műszeres analitika";
    } else {
        tanorak["Ma"] = "Műszaki alapismeretek";
    }
    return tanorak[ora] || "Nincs benne a listában";
}
