import{j as e}from"./ui-DWAV2h0C.js";import{r as i}from"./vendor-Bq2s2JnP.js";import{X as j,S as u}from"./app-DCsCKR6W.js";import{a as f}from"./html2pdf-NTzleMm2.js";import{a as n,b as t,f as l}from"./helpers-DrREEj8W.js";import{u as y}from"./useTranslation-2u_EWAAN.js";/* empty css            */import"./jspdf.es.min-_nCsLNWM.js";import"./html2canvas-BF968m9e.js";function A(){const{t:s}=y(),{entries:d,selectedAccount:o,filters:r}=j().props,[m,c]=i.useState(!1);i.useEffect(()=>{new URLSearchParams(window.location.search).get("download")==="pdf"&&x()},[]);const x=async()=>{c(!0);const a=document.querySelector(".ledger-summary-container");if(a){const p={margin:.25,filename:`ledger-summary-${n(r.from_date||new Date().toISOString())}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"a4",orientation:"portrait"}};try{await f().set(p).from(a).save(),setTimeout(()=>window.close(),1e3)}catch(h){console.error("PDF generation failed:",h)}}c(!1)};return e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx(u,{title:s("Ledger Summary")}),m&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",children:e.jsx("div",{className:"bg-white p-6 rounded-lg shadow-lg",children:e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"}),e.jsx("p",{className:"text-lg font-semibold text-gray-700",children:s("Generating PDF...")})]})})}),e.jsxs("div",{className:"ledger-summary-container bg-white max-w-4xl mx-auto p-12",children:[e.jsxs("div",{className:"flex justify-between items-start mb-12",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold mb-4",children:t("company_name")||"YOUR COMPANY"}),e.jsxs("div",{className:"text-sm space-y-1",children:[t("company_address")&&e.jsx("p",{children:t("company_address")}),(t("company_city")||t("company_state")||t("company_zipcode"))&&e.jsxs("p",{children:[t("company_city"),t("company_state")&&`, ${t("company_state")}`," ",t("company_zipcode")]}),t("company_country")&&e.jsx("p",{children:t("company_country")}),t("company_telephone")&&e.jsxs("p",{children:[s("Phone"),": ",t("company_telephone")]}),t("company_email")&&e.jsxs("p",{children:[s("Email"),": ",t("company_email")]})]})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("h2",{className:"text-2xl font-bold mb-2",children:s("LEDGER SUMMARY")}),e.jsxs("div",{className:"text-sm space-y-1",children:[r.from_date&&r.to_date&&e.jsxs("p",{children:[s("Period"),": ",n(r.from_date)," - ",n(r.to_date)]}),o&&e.jsxs("p",{children:[s("Account"),": ",o.account_code," - ",o.account_name]})]})]})]}),e.jsx("div",{className:"mb-6",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b-2 border-gray-800",children:[e.jsx("th",{className:"text-left py-2 text-sm font-bold",children:s("Date")}),e.jsx("th",{className:"text-left py-2 text-sm font-bold",children:s("Account")}),e.jsx("th",{className:"text-left py-2 text-sm font-bold",children:s("Description")}),e.jsx("th",{className:"text-right py-2 text-sm font-bold",children:s("Debit")}),e.jsx("th",{className:"text-right py-2 text-sm font-bold",children:s("Credit")})]})}),e.jsx("tbody",{children:d.map(a=>e.jsxs("tr",{className:"border-b border-gray-100",children:[e.jsx("td",{className:"py-1.5 text-sm",children:n(a.journal_date)}),e.jsx("td",{className:"py-1.5 text-sm",children:a.account_code}),e.jsx("td",{className:"py-1.5 text-sm",children:a.description||a.journal_description}),e.jsx("td",{className:"py-1.5 text-sm text-right tabular-nums",children:a.debit_amount>0?l(a.debit_amount):"-"}),e.jsx("td",{className:"py-1.5 text-sm text-right tabular-nums",children:a.credit_amount>0?l(a.credit_amount):"-"})]},a.id))})]})}),e.jsxs("div",{className:"mt-12 pt-6 border-t text-center text-sm text-gray-600",children:[e.jsx("p",{children:t("company_name")}),e.jsxs("p",{children:[s("Generated on")," ",n(new Date().toISOString())]})]})]}),e.jsx("style",{children:`
                body {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    font-family: Arial, sans-serif;
                }

                @page {
                    margin: 0.25in;
                    size: A4;
                }

                .ledger-summary-container {
                    max-width: 100%;
                    margin: 0;
                    box-shadow: none;
                }

                @media print {
                    body {
                        background: white;
                    }

                    .ledger-summary-container {
                        box-shadow: none;
                    }
                }
            `})]})}export{A as default};
