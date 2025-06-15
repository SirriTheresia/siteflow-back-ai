// import { chromium } from 'playwright'; 
// console.log('Starting printavo automation script');

// const user = 'spvc3jkkok';
// const pass = 'W4xi59jJdZ_y4rUpik'; // use full password
// console.log('Proxy credentials loaded');

// // Function to load proxies from a file or service (you can adjust based on your service)
// const loadProxies = () => {
//     console.log('Loading proxy servers');
//     const base = `http://${user}:${pass}@gate.smartproxy.com`;

//     return [
//         { server: `${base}:10004` },
//         { server: `${base}:10005` },
//         { server: `${base}:10006` },
//         { server: `${base}:10007` },
//         { server: `${base}:10008` },
//         { server: `${base}:10009` },
//         { server: `${base}:10010` },
//     ];
// };
// // Function to log into Printavo
// const loginToPrintavo = async (page, email) => {
//     const password = 'Chefor2004@';
//     console.log('Starting login process to HighLevel');
//     await page.goto('https://app.gohighlevel.com/?_gl=1%2a5xgtx5%2a_gcl_au%2aMzU1NjgwMzk1LjE3NDY4ODg1OTI.%2a_ga%2aMTM4NjkwODI3LjE3NDU1OTQwOTI.%2a_ga_HSZW8WNR22%2aczE3NDY4ODg1OTIkbzEkZzAkdDE3NDY4ODg1OTIkajYwJGwwJGgw');
//     console.log('Navigated to login page');

//     await page.waitForTimeout(800); // Wait 800ms
//     console.log('Filling email field');
//     await page.fill('#email', email, { delay: 100 });

//     await page.waitForTimeout(800); // Wait 800ms
//     console.log('Filling password field');
//     await page.fill('#password', password, { delay: 100 });

//     await page.waitForTimeout(800); // Wait 800ms
//     console.log('Clicking login button');
//     await page.click('button.hl-btn.justify-center.w-full.inline-flex.items-center.px-4.py-2.border.border-transparent.text-sm.font-medium.rounded.text-white.bg-curious-blue-500.hover\\:bg-curious-blue-600.focus\\:outline-none.focus\\:ring-2.focus\\:ring-offset-2.focus\\:ring-curious-blue-600');

//     // Wait for the verify password button to appear
//     console.log('Waiting for security code button to appear');
//     await page.waitForSelector('button:has-text("Send Security Code")', { state: 'visible' });

//     // Click the verify button
//     console.log('Clicking "Send Security Code" button');
//     await page.click('button:has-text("Send Security Code")');

//     // Wait for manual code entry - this will pause execution until user interaction
//     console.log('Please enter the verification code manually...');
//     // INSERT_YOUR_CODE
//     console.log('Polling for the presence of the security code message or agency dashboard');
//     let messageFound = false;
//     const maxRetries = 40;
//     let attempts = 0;

//     while (!messageFound && attempts < maxRetries) {
//         console.log(`Attempt ${attempts + 1} of ${maxRetries}`);
//         try {
//             console.log('Checking visibility of security code message');
//             const isSecurityCodeMessageVisible = await page.isVisible('text=The security code is not');
//             console.log('Checking visibility of agency dashboard message');
//             const isAgencyDashboardVisible = await page.isVisible('text=Click here to switch');

//             if (isSecurityCodeMessageVisible) {
//                 console.log('The security code message is visible on the screen');
//                 // messageFound = true;
//             } else if (isAgencyDashboardVisible) {
//                 console.log('The agency dashboard message is visible, breaking the loop');
//                 break;
//             } else {
//                 console.log('Neither the security code message nor the agency dashboard message is visible, retrying...');
//             }
//         } catch (error) {
//             console.error('Error checking for messages:', error);
//         }
//         attempts++;
//         console.log(`Completed attempt ${attempts}, messageFound: ${messageFound}`);
//         if (!messageFound) {
//             console.log('Waiting for 2 seconds before retrying');
//             await page.waitForTimeout(2000); // Wait for 2 seconds before retrying
//         }
//     }
//     console.log('Exited the message checking loop');

//     if (!messageFound) {
//         console.log('The security code message was not found after maximum retries');
//     }
//     // await page.waitForTimeout(20000); // Wait for 20 seconds
//     console.log('Resuming after verification code wait period');

//     // Continue after verification is complete
//     console.log('Waiting for navigation after verification');
//     // await page.waitForNavigation({ waitUntil: 'networkidle' });
//     // console.log('Login process completed');
// };



// // Function to rotate proxies and execute tasks
// export const runclickSelectionButton = async (email, password, quoteDetails) => {
//     console.log('Starting runclickSelectionButton function');
//     console.log(`Email: ${email}`);
//     console.log('Password: [REDACTED]');

//     try {
//         // Launch browser without proxy
//         console.log('Launching browser without proxy');
//         const browser = await chromium.launch({
//             headless: false
//         });
//         console.log('Browser launched successfully');

//         console.log('Creating browser context');
//         const context = await browser.newContext();
//         console.log('Creating new page');
//         const page = await context.newPage();
//         console.log('New page created');
//         const objectt = {
//   "About Us": "Escobar Landscaping in MaryLand, ML is your go-to expert for all your landscaping needs. With years of experience in the industry, we are dedicated to transforming outdoor spaces into beautiful and functional areas that reflect the unique taste and style of each client. Our team is passionate about designing landscapes that are not only visually stunning but also environmentally sustainable. Whether it's residential or commercial projects, we take pride in our attention to detail and commitment to quality.",
//   "Service 1": "Design and Installation",
//   "Service 1 Homepage Blurb": "Bring your dream landscape to life with our comprehensive design and installation services.",
//   "Service 1 Text 1": "Our design and installation service begins with a personalized consultation. We take the time to understand your vision, preferences, and site conditions to create a custom plan that meets your needs. From selecting the right plants to designing hardscape elements like patios and walkways, our team is committed to delivering exceptional results. Our goal is to create an outdoor space that enhances your lifestyle while adding value to your property.",
//   "Service 1 Text 2": "With our design expertise, every element of your landscape will be carefully considered. We focus on creating harmonious outdoor environments that are both beautiful and functional. Our team collaborates closely with you to select the right plants, materials, and finishes, ensuring that the final design aligns with your vision. By combining creativity with technical skill, we deliver landscapes that are unique, timeless, and tailored to your property.",
//   "Service 1 Text 3": "Installation is executed with precision and care by our experienced team. We handle everything from site preparation to planting and hardscape construction. Using the highest quality materials and proven techniques, we ensure that your new landscape is built to last. Our attention to detail and commitment to craftsmanship mean you can enjoy a seamless and stress-free installation process, with exceptional results that will delight for years to come.",
//   "Service 1 Headline 1": "Customized Landscape Design",
//   "Service 1 Headline 2": "Expert Selection of Plants and Materials",
//   "Service 1 Headline 3": "Precision Installation",
//   "Service Area 1": "Baltimore, ML",
//   "Service Area 1 Text 1": "Escobar Landscaping is proud to serve the vibrant community of Baltimore, ML, offering top-notch design and installation services tailored to this unique environment. Our expertise in crafting landscapes that flourish in urban settings means that Baltimore residents can rely on us to create beautiful and sustainable outdoor spaces. We work closely with clients to incorporate local plants and materials, ensuring that the final result is not only stunning but also environmentally responsible.",
//   "Service Area 1 Text 2": "For those living in Baltimore, ML, enhancing curb appeal is a priority. Escobar Landscaping specializes in transforming front yards and public spaces into welcoming areas that reflect the historic charm and modern vibrancy of the city. Our attention to detail and innovative designs elevate your property's appearance while respecting Baltimore's unique architectural heritage. Trust us to enhance your home’s exterior with elegant landscaping solutions that align with the community’s aesthetic values.",
//   "Service Area 1 Text 3": "Our dedicated team understands the specific challenges and opportunities presented by Baltimore's climate and landscape. We use this knowledge to create outdoor spaces that are resilient and adaptable throughout the seasons. Whether it’s managing the summer heat or enhancing winter resilience, we provide landscaping solutions that maintain their beauty year-round. Escobar Landscaping proudly offers a level of local expertise that ensures success in the Baltimore area.",
//   "Service Area 1 Headline 1": "Top Design Services in Baltimore",
//   "Service Area 1 Headline 2": "Enhancing Curb Appeal in Baltimore",
//   "Service Area 1 Headline 3": "Seasonal Resilience for Baltimore Landscapes",
//   "Service Area 2": "Rockville, ML",
//   "Service Area 2 Text 1": "In Rockville, ML, we bring our extensive landscaping expertise to both residential and commercial properties. Escobar Landscaping delivers custom solutions that reflect Rockville's modern suburban charm. Whether you’re looking to create a backyard oasis or need commercial landscaping that impresses clients and visitors, our team is dedicated to meeting your specific needs with creativity and precision.",
//   "Service Area 2 Text 2": "For Rockville residents, a well-designed landscape can enhance the quality of life and increase property value. Our team prides itself on crafting outdoor spaces that encourage relaxation and enjoyment while incorporating smart, sustainable practices. With a deep understanding of Rockville’s specific landscape needs, we integrate environmentally friendly solutions that thrive in this community’s unique climate.",
//   "Service Area 2 Text 3": "Escobar Landscaping applies innovative techniques and local expertise to every project in Rockville, ML. We prioritize usability and aesthetics, ensuring that your outdoor space not only looks great but also functions perfectly for your lifestyle. Rockville’s residents can count on us for beautifully designed landscapes that stand out and stand up to local weather conditions year after year.",
//   "Service Area 2 Headline 1": "Custom Landscaping for Rockville",
//   "Service Area 2 Headline 2": "Enhancing Property Value in Rockville",
//   "Service Area 2 Headline 3": "Innovative Techniques for Rockville Landscapes",
//   "Service Area 3": "Columbia, ML",
//   "Service Area 3 Text 1": "In Columbia, ML, Escobar Landscaping has established a reputation for excellence in landscape design and installation. Our team understands the diverse needs of Columbia residents and offers tailored solutions to enhance outdoor spaces throughout this vibrant community. With a commitment to sustainability and beauty, we create landscapes that complement both modern and traditional homes.",
//   "Service Area 3 Text 2": "Columbia’s residents appreciate the importance of a well-maintained landscape that offers both aesthetic value and practical benefits. Escobar Landscaping provides solutions that enhance the usability and enjoyment of outdoor areas while respecting the natural environment. From creating inviting garden spaces to installing functional hardscapes, our work reflects Columbia's values of beauty and sustainability.",
//   "Service Area 3 Text 3": "As specialists in Columbia, ML, Escobar Landscaping addresses the challenges posed by local weather conditions to ensure year-round landscape beauty. Our skilled professionals design and implement strategies that accommodate seasonal changes and maintain landscape vitality. Columbia customers benefit from our dedication to delivering durable and stunning landscapes that contribute positively to community aesthetics.",
//   "Service Area 3 Headline 1": "Excellence in Columbia Landscape Design",
//   "Service Area 3 Headline 2": "Sustainable Solutions for Columbia",
//   "Service Area 3 Headline 3": "Year-Round Beauty for Columbia Landscapes",
//   "Service Area 4": "Silver Spring, ML",
//   "Service Area 4 Text 1": "Escobar Landscaping brings its expert landscaping services to Silver Spring, ML, offering residents tailored solutions for both homes and commercial properties. Our deep understanding of the local area allows us to craft landscapes that enhance Silver Spring’s picturesque urban environment. Whether you seek a lush backyard retreat or an attractive commercial frontage, our team is ready to deliver outstanding results.",
//   "Service Area 4 Text 2": "In Silver Spring, astonishing curb appeal and functional outdoor spaces are essential for property enhancement. Escobar Landscaping specializes in creating versatile areas that reflect the dynamic characteristics of this bustling urban center. Our designs incorporate native plants and sustainable practices, resulting in landscapes that are visually appealing and environmentally sound.",
//   "Service Area 4 Text 3": "Silver Spring’s diverse climate presents unique landscaping challenges and opportunities, all of which we are well-equipped to handle. Through our innovative approaches and quality craftsmanship, Escobar Landscaping ensures that your landscape thrives throughout the year. We aim to exceed expectations by delivering resilient landscaping solutions that reflect the vibrant spirit of Silver Spring.",
//   "Service Area 4 Headline 1": "Customized Landscaping in Silver Spring",
//   "Service Area 4 Headline 2": "Curb Appeal and Functionality for Silver Spring",
//   "Service Area 4 Headline 3": "Resilient Landscapes for Silver Spring",
//   "Service Area 5": "Gaithersburg, ML",
//   "Service Area 5 Text 1": "The community of Gaithersburg, ML, can rely on Escobar Landscaping to deliver high-quality landscaping solutions tailored to their needs. Our comprehensive approach to landscape design ensures that every aspect of your outdoor area is addressed, from plant selection to layout and installation. We are devoted to creating captivating landscapes that enhance both residential and commercial properties in the area.",
//   "Service Area 5 Text 2": "In Gaithersburg, ML, property owners have a unique opportunity to improve their outdoor environments with Escobar Landscaping's expertise. Our sustainable landscaping practices foster the growth of healthy plants and ecosystems, creating vibrant environments that complement the town’s distinctive character. Our team’s knowledge of local soil and climate conditions allows us to offer landscaping solutions that thrive in Gaithersburg.",
//   "Service Area 5 Text 3": "Escobar Landscaping stands out in Gaithersburg for our exceptional customer service and attention to detail. We provide our clients with personalized care and customized designs that reflect their individual preferences. Our goal is to create breathtaking landscapes that offer long-term satisfaction and beauty for Gaithersburg residents, ensuring that their properties become the envy of the neighborhood.",
//   "Service Area 5 Headline 1": "Quality Landscaping for Gaithersburg Residents",
//   "Service Area 5 Headline 2": "Sustainable Practices in Gaithersburg",
//   "Service Area 5 Headline 3": "Personalized Care for Gaithersburg Landscapes",
//   "Company Name": "Escabar landscaping",
//   "Company Owner First Name": "Gonzales Cleaning",
//   "Company Email": "anyesirri6@gmail.com",
//   "Global Button Colors": "#0066cc",
//   "Broad Service Name": "",
//   "Sub Headline Text": "",
//   "Company GMB Link": "",
//   "Company Facebook Link": "",
//   "Google Map Embed": "",
//   "GMB Review Link": "",
//   "Company Instagram Link": "",
//   "Company Phone (Aesthetic)": "(123) 455-5678",
//   "Company Phone (Functional)": "11234555678"
// }
//         await realAuto(page, email, objectt)  
//         // await createTrackingCustomValues(page, email);   

//         // await runPipelineOrganizing(page, context);
//     } catch (error) {
//         console.error(`Error in runclickSelectionButton: ${error.message}`);
//         console.error(error.stack);
//     }
//     // console.log('Completed runclickSelectionButton function');
// };




// // Example usage
// // const email = 'terrencechungong784@gmail.com'; // Your Printavo account email
// // const password = 'Chefor2004'; // Your Printavo account password

// // runclickSelectionButton(email, password);
// const realAuto = async (page, email, objectJson) => {
//     const fallbackMap = {
//         'Service Area 1': 'Biz Area 1',
//         'Service Area 2': 'Biz Area 2',
//         'Service Area 3': 'Biz Area 3',
//         'Service Area 4': 'Biz Area 4',
//         'Service Area 5': 'Biz Area 5',
//         'Service Area 6': 'Biz Area 6',
//         'Service Area 7': 'Biz Area 7',
//         'Service Area 8': 'Biz Area 8',
//         'Service Area 9': 'Biz Area 9',
//         'Service Area 10': 'Biz Area 10',
//         'Service Area 11': 'Biz Area 11',
//         'Service Area 12': 'Biz Area 12'
//     };
//     const serviceAreaKeys = [
//         'Service Area 1',
//         'Service Area 2',
//         'Service Area 3',
//         'Service Area 4',
//         'Service Area 5',
//         'Service Area 6',
//         'Service Area 7',
//         'Service Area 8',
//         'Service Area 9',
//         'Service Area 10',
//         'Service Area 11',
//         'Service Area 12'
//     ];
//     await page.goto('https://app.gohighlevel.com/');
//     await loginToPrintavo(page, email);
//     await page.goto('https://app.gohighlevel.com/v2/location/xePgFvclSqFvbRdsuLOh/settings/custom_values')

//     // await page.getByRole('textbox', { name: 'Enter name' }).fill('Service 1 Hompage Blurb');
//     let labels = Object.keys(objectJson)

//     for (const label of labels) {
//         var serviceArea = false;

//         if (objectJson[label] == "") {
//             continue
//         }
//         var useLabel = '';
//         if (serviceAreaKeys.includes(label)) {
//             useLabel = fallbackMap[label];
//             serviceArea = true;
//         } else {
//             useLabel = label
//         }
//         await page.locator('button', { hasText: 'New Custom Value' }).first().click();
//         await page.getByRole('textbox', { name: 'Enter name' }).fill(label);
//         await page.getByRole('button', { name: 'Create' }).click();
//                 await page.waitForTimeout(3000); // wait 3 seconds
//         await page.getByRole('textbox', { name: 'Search Custom Values' }).click();
//         await page.getByRole('textbox', { name: 'Search Custom Values' }).fill(useLabel)
//         // await page.getByRole('row', { name: useLabel + ' {{' }).locator('svg').nth(2).click();
//         // await page.getByRole('row', { name: 'Service 1 Services {{' }).locator('svg').nth(3).click();

//         try {
//             await page.getByRole('row', { name: useLabel + ' {{' }).locator('svg').nth(2).click();
//         } catch (err) {
//             const isServiceArea = serviceArea ? 'Service Areas' : 'Services'
//             await page.getByRole('row', { name: useLabel + ` ${isServiceArea} {{` }).locator('svg').nth(3).click();
//         }
//         await page.getByText('Edit Custom Value').click();
//         await page.getByRole('textbox', { name: 'Enter value' }).click();
//         await page.getByRole('textbox', { name: 'Enter value' }).fill(objectJson[label]);
//         await page.getByRole('button', { name: 'Update' }).click();
//         await page.waitForTimeout(3000); // wait 3 seconds
//     }

// }


// runclickSelectionButton('tee@gositeflow.com', "//", "f")

require('./src/server.js')