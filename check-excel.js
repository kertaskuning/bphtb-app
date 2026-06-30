const XLSX = require('xlsx');
const workbook = XLSX.readFile('C:/Users/msyaf/Downloads/Data Base Nilai Pasar 2027 (1).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

const headers = data[0];
const districtIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('kecamatan'));
const villageIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('desa'));
const addressIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('nama jalan'));
const zntIdx = headers.findIndex(h => h && h.toString().toLowerCase().includes('znt'));

console.log('Indexes:', { districtIdx, villageIdx, addressIdx, zntIdx });

const sindanglayaData = data.filter(row => row[villageIdx] && row[villageIdx].toString().trim().toUpperCase() === 'SINDANGLAYA');
console.log('Sindanglaya rows found:', sindanglayaData.length);

const addresses = sindanglayaData.map(row => row[addressIdx]);
console.log('Addresses in Excel:', [...new Set(addresses)]);
