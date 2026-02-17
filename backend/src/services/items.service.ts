import { supabaseAdmin } from '../config/supabase';
import { DateRangeParams } from '../types';

// Common HSN codes for Indian GST - comprehensive list
const HSN_CODES_DATA = [
  // Chapter 1-5: Live animals, Animal Products
  { code: '0101', description: 'Live horses, asses, mules and hinnies', chapter: '01' },
  { code: '0102', description: 'Live bovine animals', chapter: '01' },
  { code: '0201', description: 'Meat of bovine animals, fresh or chilled', chapter: '02' },
  { code: '0301', description: 'Live fish', chapter: '03' },
  { code: '0401', description: 'Milk and cream, not concentrated', chapter: '04' },
  { code: '0402', description: 'Milk and cream, concentrated or sweetened', chapter: '04' },
  { code: '0501', description: 'Human hair, unworked', chapter: '05' },

  // Chapter 6-14: Vegetable Products
  { code: '0601', description: 'Bulbs, tubers, tuberous roots', chapter: '06' },
  { code: '0701', description: 'Potatoes, fresh or chilled', chapter: '07' },
  { code: '0702', description: 'Tomatoes, fresh or chilled', chapter: '07' },
  { code: '0703', description: 'Onions, shallots, garlic, leeks', chapter: '07' },
  { code: '0801', description: 'Coconuts, Brazil nuts, cashew nuts', chapter: '08' },
  { code: '0901', description: 'Coffee', chapter: '09' },
  { code: '0902', description: 'Tea', chapter: '09' },
  { code: '0910', description: 'Ginger, saffron, turmeric, spices', chapter: '09' },
  { code: '1001', description: 'Wheat and meslin', chapter: '10' },
  { code: '1006', description: 'Rice', chapter: '10' },
  { code: '1101', description: 'Wheat or meslin flour', chapter: '11' },
  { code: '1201', description: 'Soya beans', chapter: '12' },
  { code: '1301', description: 'Lac, natural gums, resins', chapter: '13' },

  // Chapter 15: Fats and Oils
  { code: '1501', description: 'Pig fat and poultry fat', chapter: '15' },
  { code: '1507', description: 'Soya-bean oil', chapter: '15' },
  { code: '1509', description: 'Olive oil', chapter: '15' },
  { code: '1511', description: 'Palm oil', chapter: '15' },
  { code: '1512', description: 'Sunflower-seed, safflower or cotton-seed oil', chapter: '15' },

  // Chapter 16-24: Prepared Foods
  { code: '1601', description: 'Sausages and similar products of meat', chapter: '16' },
  { code: '1701', description: 'Cane or beet sugar', chapter: '17' },
  { code: '1704', description: 'Sugar confectionery', chapter: '17' },
  { code: '1806', description: 'Chocolate and cocoa preparations', chapter: '18' },
  { code: '1901', description: 'Malt extract, food preparations of flour', chapter: '19' },
  { code: '1902', description: 'Pasta', chapter: '19' },
  { code: '1905', description: 'Bread, pastry, cakes, biscuits', chapter: '19' },
  { code: '2001', description: 'Vegetables, fruit, nuts, prepared by vinegar', chapter: '20' },
  { code: '2009', description: 'Fruit juices', chapter: '20' },
  { code: '2101', description: 'Extracts of coffee, tea', chapter: '21' },
  { code: '2106', description: 'Food preparations not elsewhere specified', chapter: '21' },
  { code: '2201', description: 'Waters, including mineral and aerated', chapter: '22' },
  { code: '2202', description: 'Waters with added sugar or sweetening', chapter: '22' },
  { code: '2203', description: 'Beer made from malt', chapter: '22' },
  { code: '2401', description: 'Unmanufactured tobacco', chapter: '24' },

  // Chapter 25-27: Mineral Products
  { code: '2501', description: 'Salt, pure sodium chloride', chapter: '25' },
  { code: '2523', description: 'Portland cement, aluminous cement', chapter: '25' },
  { code: '2601', description: 'Iron ores and concentrates', chapter: '26' },
  { code: '2701', description: 'Coal, briquettes', chapter: '27' },
  { code: '2709', description: 'Petroleum oils, crude', chapter: '27' },
  { code: '2710', description: 'Petroleum oils, not crude', chapter: '27' },
  { code: '2711', description: 'Petroleum gases', chapter: '27' },

  // Chapter 28-38: Chemicals
  { code: '2801', description: 'Fluorine, chlorine, bromine, iodine', chapter: '28' },
  { code: '2804', description: 'Hydrogen, rare gases, oxygen', chapter: '28' },
  { code: '2835', description: 'Phosphinates, phosphonates', chapter: '28' },
  { code: '2836', description: 'Carbonates, peroxocarbonates', chapter: '28' },
  { code: '2901', description: 'Acyclic hydrocarbons', chapter: '29' },
  { code: '3001', description: 'Glands and organs for organo-therapeutic uses', chapter: '30' },
  { code: '3003', description: 'Medicaments, not in measured doses', chapter: '30' },
  { code: '3004', description: 'Medicaments, in measured doses', chapter: '30' },
  { code: '3006', description: 'Pharmaceutical goods', chapter: '30' },
  { code: '3101', description: 'Animal or vegetable fertilizers', chapter: '31' },
  { code: '3208', description: 'Paints and varnishes', chapter: '32' },
  { code: '3209', description: 'Paints based on acrylic polymers', chapter: '32' },
  { code: '3301', description: 'Essential oils', chapter: '33' },
  { code: '3303', description: 'Perfumes and toilet waters', chapter: '33' },
  { code: '3304', description: 'Beauty or make-up preparations', chapter: '33' },
  { code: '3305', description: 'Hair preparations', chapter: '33' },
  { code: '3306', description: 'Oral or dental hygiene preparations', chapter: '33' },
  { code: '3401', description: 'Soap, organic surface-active products', chapter: '34' },
  { code: '3402', description: 'Washing and cleaning preparations', chapter: '34' },
  { code: '3506', description: 'Prepared glues and adhesives', chapter: '35' },
  { code: '3808', description: 'Insecticides, fungicides, herbicides', chapter: '38' },

  // Chapter 39-40: Plastics and Rubber
  { code: '3901', description: 'Polymers of ethylene, primary forms', chapter: '39' },
  { code: '3917', description: 'Tubes, pipes, hoses of plastics', chapter: '39' },
  { code: '3919', description: 'Self-adhesive plates of plastics', chapter: '39' },
  { code: '3920', description: 'Other plates, sheets, film of plastics', chapter: '39' },
  { code: '3923', description: 'Articles for conveyance or packing of plastics', chapter: '39' },
  { code: '3924', description: 'Tableware, kitchenware of plastics', chapter: '39' },
  { code: '3926', description: 'Other articles of plastics', chapter: '39' },
  { code: '4001', description: 'Natural rubber', chapter: '40' },
  { code: '4011', description: 'New pneumatic tyres, of rubber', chapter: '40' },
  { code: '4012', description: 'Retreaded or used pneumatic tyres', chapter: '40' },
  { code: '4016', description: 'Other articles of vulcanised rubber', chapter: '40' },

  // Chapter 41-43: Leather and Skins
  { code: '4101', description: 'Raw hides and skins of bovine', chapter: '41' },
  { code: '4202', description: 'Trunks, suitcases, handbags', chapter: '42' },
  { code: '4203', description: 'Articles of apparel of leather', chapter: '42' },

  // Chapter 44-49: Wood, Paper
  { code: '4401', description: 'Fuel wood, wood chips', chapter: '44' },
  { code: '4407', description: 'Wood sawn or chipped lengthwise', chapter: '44' },
  { code: '4410', description: 'Particle board of wood', chapter: '44' },
  { code: '4411', description: 'Fibreboard of wood', chapter: '44' },
  { code: '4418', description: 'Builders joinery and carpentry of wood', chapter: '44' },
  { code: '4421', description: 'Other articles of wood', chapter: '44' },
  { code: '4801', description: 'Newsprint', chapter: '48' },
  { code: '4802', description: 'Uncoated paper for writing', chapter: '48' },
  { code: '4817', description: 'Envelopes, letter cards', chapter: '48' },
  { code: '4818', description: 'Toilet paper, tissues, napkins', chapter: '48' },
  { code: '4819', description: 'Cartons, boxes, bags of paper', chapter: '48' },
  { code: '4820', description: 'Registers, account books, notebooks', chapter: '48' },
  { code: '4821', description: 'Paper or paperboard labels', chapter: '48' },
  { code: '4901', description: 'Printed books, brochures', chapter: '49' },
  { code: '4902', description: 'Newspapers, journals, periodicals', chapter: '49' },

  // Chapter 50-63: Textiles
  { code: '5001', description: 'Silk-worm cocoons', chapter: '50' },
  { code: '5101', description: 'Wool, not carded or combed', chapter: '51' },
  { code: '5201', description: 'Cotton, not carded or combed', chapter: '52' },
  { code: '5208', description: 'Woven fabrics of cotton', chapter: '52' },
  { code: '5209', description: 'Woven fabrics of cotton, 85% or more', chapter: '52' },
  { code: '5407', description: 'Woven fabrics of synthetic filament yarn', chapter: '54' },
  { code: '5503', description: 'Synthetic staple fibres', chapter: '55' },
  { code: '5509', description: 'Yarn of synthetic staple fibres', chapter: '55' },
  { code: '5512', description: 'Woven fabrics of synthetic staple fibres', chapter: '55' },
  { code: '6001', description: 'Pile fabrics, knitted or crocheted', chapter: '60' },
  { code: '6101', description: 'Men\'s overcoats, knitted', chapter: '61' },
  { code: '6102', description: 'Women\'s overcoats, knitted', chapter: '61' },
  { code: '6103', description: 'Men\'s suits, knitted', chapter: '61' },
  { code: '6104', description: 'Women\'s suits, knitted', chapter: '61' },
  { code: '6105', description: 'Men\'s shirts, knitted', chapter: '61' },
  { code: '6106', description: 'Women\'s blouses, knitted', chapter: '61' },
  { code: '6109', description: 'T-shirts, singlets, knitted', chapter: '61' },
  { code: '6110', description: 'Jerseys, pullovers, cardigans, knitted', chapter: '61' },
  { code: '6201', description: 'Men\'s overcoats, not knitted', chapter: '62' },
  { code: '6202', description: 'Women\'s overcoats, not knitted', chapter: '62' },
  { code: '6203', description: 'Men\'s suits, not knitted', chapter: '62' },
  { code: '6204', description: 'Women\'s suits, not knitted', chapter: '62' },
  { code: '6205', description: 'Men\'s shirts, not knitted', chapter: '62' },
  { code: '6206', description: 'Women\'s blouses, not knitted', chapter: '62' },
  { code: '6211', description: 'Track suits, ski suits, swimwear', chapter: '62' },
  { code: '6301', description: 'Blankets and travelling rugs', chapter: '63' },
  { code: '6302', description: 'Bed linen, table linen, toilet linen', chapter: '63' },

  // Chapter 64-67: Footwear, Headgear
  { code: '6401', description: 'Waterproof footwear', chapter: '64' },
  { code: '6402', description: 'Other footwear with outer soles of rubber', chapter: '64' },
  { code: '6403', description: 'Footwear with outer soles of rubber, leather uppers', chapter: '64' },
  { code: '6404', description: 'Footwear with outer soles of rubber, textile uppers', chapter: '64' },
  { code: '6405', description: 'Other footwear', chapter: '64' },
  { code: '6504', description: 'Hats and headgear, plaited', chapter: '65' },
  { code: '6505', description: 'Hats and headgear, knitted or crocheted', chapter: '65' },
  { code: '6506', description: 'Other headgear', chapter: '65' },

  // Chapter 68-70: Stone, Ceramic, Glass
  { code: '6801', description: 'Setts, curbstones, flagstones', chapter: '68' },
  { code: '6802', description: 'Worked monumental or building stone', chapter: '68' },
  { code: '6810', description: 'Articles of cement, concrete', chapter: '68' },
  { code: '6901', description: 'Bricks, blocks, tiles of siliceous earth', chapter: '69' },
  { code: '6902', description: 'Refractory bricks, blocks', chapter: '69' },
  { code: '6904', description: 'Ceramic building bricks', chapter: '69' },
  { code: '6905', description: 'Roofing tiles', chapter: '69' },
  { code: '6907', description: 'Ceramic flags and paving', chapter: '69' },
  { code: '6908', description: 'Glazed ceramic flags and paving', chapter: '69' },
  { code: '6910', description: 'Ceramic sinks, wash basins, baths', chapter: '69' },
  { code: '6911', description: 'Tableware of porcelain', chapter: '69' },
  { code: '6912', description: 'Ceramic tableware, not porcelain', chapter: '69' },
  { code: '7001', description: 'Cullet and other waste glass', chapter: '70' },
  { code: '7003', description: 'Cast glass and rolled glass', chapter: '70' },
  { code: '7005', description: 'Float glass and surface ground glass', chapter: '70' },
  { code: '7010', description: 'Carboys, bottles, jars of glass', chapter: '70' },
  { code: '7013', description: 'Glassware for table, kitchen, toilet', chapter: '70' },

  // Chapter 71: Precious Stones and Metals
  { code: '7101', description: 'Pearls, natural or cultured', chapter: '71' },
  { code: '7102', description: 'Diamonds', chapter: '71' },
  { code: '7103', description: 'Precious stones', chapter: '71' },
  { code: '7106', description: 'Silver', chapter: '71' },
  { code: '7108', description: 'Gold', chapter: '71' },
  { code: '7113', description: 'Jewellery of precious metal', chapter: '71' },
  { code: '7114', description: 'Articles of goldsmiths\' wares', chapter: '71' },
  { code: '7117', description: 'Imitation jewellery', chapter: '71' },

  // Chapter 72-83: Base Metals
  { code: '7201', description: 'Pig iron and spiegeleisen', chapter: '72' },
  { code: '7206', description: 'Iron and non-alloy steel ingots', chapter: '72' },
  { code: '7207', description: 'Semi-finished products of iron', chapter: '72' },
  { code: '7208', description: 'Flat-rolled products of iron, hot-rolled', chapter: '72' },
  { code: '7209', description: 'Flat-rolled products of iron, cold-rolled', chapter: '72' },
  { code: '7210', description: 'Flat-rolled products of iron, clad, plated', chapter: '72' },
  { code: '7213', description: 'Bars and rods, hot-rolled', chapter: '72' },
  { code: '7214', description: 'Other bars and rods', chapter: '72' },
  { code: '7215', description: 'Other bars and rods of iron', chapter: '72' },
  { code: '7216', description: 'Angles, shapes, sections of iron', chapter: '72' },
  { code: '7217', description: 'Wire of iron or non-alloy steel', chapter: '72' },
  { code: '7301', description: 'Sheet piling of iron or steel', chapter: '73' },
  { code: '7303', description: 'Tubes, pipes of cast iron', chapter: '73' },
  { code: '7304', description: 'Tubes, pipes of iron, seamless', chapter: '73' },
  { code: '7306', description: 'Other tubes, pipes of iron', chapter: '73' },
  { code: '7307', description: 'Tube or pipe fittings', chapter: '73' },
  { code: '7308', description: 'Structures of iron or steel', chapter: '73' },
  { code: '7309', description: 'Reservoirs, tanks of iron', chapter: '73' },
  { code: '7310', description: 'Tanks, casks, drums of iron', chapter: '73' },
  { code: '7318', description: 'Screws, bolts, nuts, washers', chapter: '73' },
  { code: '7320', description: 'Springs of iron or steel', chapter: '73' },
  { code: '7321', description: 'Stoves, ranges, grates of iron', chapter: '73' },
  { code: '7322', description: 'Radiators for central heating', chapter: '73' },
  { code: '7323', description: 'Table, kitchen, household articles', chapter: '73' },
  { code: '7324', description: 'Sanitary ware of iron', chapter: '73' },
  { code: '7325', description: 'Other cast articles of iron', chapter: '73' },
  { code: '7326', description: 'Other articles of iron or steel', chapter: '73' },
  { code: '7401', description: 'Copper mattes, cement copper', chapter: '74' },
  { code: '7403', description: 'Refined copper, copper alloys', chapter: '74' },
  { code: '7407', description: 'Copper bars, rods, profiles', chapter: '74' },
  { code: '7408', description: 'Copper wire', chapter: '74' },
  { code: '7411', description: 'Copper tubes and pipes', chapter: '74' },
  { code: '7419', description: 'Other articles of copper', chapter: '74' },
  { code: '7501', description: 'Nickel mattes, oxide sinters', chapter: '75' },
  { code: '7601', description: 'Unwrought aluminium', chapter: '76' },
  { code: '7604', description: 'Aluminium bars, rods, profiles', chapter: '76' },
  { code: '7606', description: 'Aluminium plates, sheets', chapter: '76' },
  { code: '7607', description: 'Aluminium foil', chapter: '76' },
  { code: '7608', description: 'Aluminium tubes and pipes', chapter: '76' },
  { code: '7610', description: 'Aluminium structures', chapter: '76' },
  { code: '7612', description: 'Aluminium casks, drums, cans', chapter: '76' },
  { code: '7615', description: 'Table, kitchen, household articles of aluminium', chapter: '76' },
  { code: '7616', description: 'Other articles of aluminium', chapter: '76' },
  { code: '7801', description: 'Unwrought lead', chapter: '78' },
  { code: '7901', description: 'Unwrought zinc', chapter: '79' },
  { code: '8001', description: 'Unwrought tin', chapter: '80' },
  { code: '8101', description: 'Tungsten and articles thereof', chapter: '81' },
  { code: '8201', description: 'Hand tools, spades, shovels, axes', chapter: '82' },
  { code: '8202', description: 'Hand saws, blades for saws', chapter: '82' },
  { code: '8203', description: 'Files, rasps, pliers, pincers', chapter: '82' },
  { code: '8204', description: 'Hand-operated spanners and wrenches', chapter: '82' },
  { code: '8205', description: 'Hand tools, blow lamps, vices', chapter: '82' },
  { code: '8207', description: 'Interchangeable tools for hand tools', chapter: '82' },
  { code: '8208', description: 'Knives and cutting blades', chapter: '82' },
  { code: '8210', description: 'Hand-operated mechanical appliances', chapter: '82' },
  { code: '8211', description: 'Knives with cutting blades', chapter: '82' },
  { code: '8212', description: 'Razors and razor blades', chapter: '82' },
  { code: '8213', description: 'Scissors and blades', chapter: '82' },
  { code: '8214', description: 'Other cutlery', chapter: '82' },
  { code: '8215', description: 'Spoons, forks, ladles, skimmers', chapter: '82' },
  { code: '8301', description: 'Padlocks and locks', chapter: '83' },
  { code: '8302', description: 'Base metal mountings, fittings', chapter: '83' },
  { code: '8303', description: 'Armoured safes, strong boxes', chapter: '83' },
  { code: '8304', description: 'Filing cabinets, card-index cabinets', chapter: '83' },
  { code: '8305', description: 'Fittings for loose-leaf binders', chapter: '83' },
  { code: '8306', description: 'Bells, gongs, statuettes', chapter: '83' },
  { code: '8308', description: 'Clasps, frames with clasps, buckles', chapter: '83' },
  { code: '8310', description: 'Sign-plates, name-plates', chapter: '83' },
  { code: '8311', description: 'Wire, rods, electrodes', chapter: '83' },

  // Chapter 84: Machinery
  { code: '8401', description: 'Nuclear reactors, fuel elements', chapter: '84' },
  { code: '8402', description: 'Steam boilers', chapter: '84' },
  { code: '8403', description: 'Central heating boilers', chapter: '84' },
  { code: '8407', description: 'Spark-ignition engines', chapter: '84' },
  { code: '8408', description: 'Compression-ignition engines', chapter: '84' },
  { code: '8409', description: 'Parts for engines', chapter: '84' },
  { code: '8411', description: 'Turbo-jets, turbo-propellers', chapter: '84' },
  { code: '8413', description: 'Pumps for liquids', chapter: '84' },
  { code: '8414', description: 'Air or vacuum pumps, fans, blowers', chapter: '84' },
  { code: '8415', description: 'Air conditioning machines', chapter: '84' },
  { code: '8416', description: 'Furnace burners', chapter: '84' },
  { code: '8417', description: 'Industrial or laboratory furnaces', chapter: '84' },
  { code: '8418', description: 'Refrigerators, freezers', chapter: '84' },
  { code: '8419', description: 'Machinery for temperature changing', chapter: '84' },
  { code: '8420', description: 'Calendering or rolling machines', chapter: '84' },
  { code: '8421', description: 'Centrifuges, filtering machinery', chapter: '84' },
  { code: '8422', description: 'Dishwashing machines', chapter: '84' },
  { code: '8423', description: 'Weighing machinery', chapter: '84' },
  { code: '8424', description: 'Mechanical appliances for projecting', chapter: '84' },
  { code: '8425', description: 'Pulley tackle, hoists, winches', chapter: '84' },
  { code: '8426', description: 'Ships\' derricks, cranes', chapter: '84' },
  { code: '8427', description: 'Fork-lift trucks', chapter: '84' },
  { code: '8428', description: 'Other lifting, handling machinery', chapter: '84' },
  { code: '8429', description: 'Self-propelled bulldozers, graders', chapter: '84' },
  { code: '8430', description: 'Other moving, grading machinery', chapter: '84' },
  { code: '8431', description: 'Parts for machinery', chapter: '84' },
  { code: '8432', description: 'Agricultural machinery for soil preparation', chapter: '84' },
  { code: '8433', description: 'Harvesting or threshing machinery', chapter: '84' },
  { code: '8434', description: 'Milking machines', chapter: '84' },
  { code: '8437', description: 'Machines for cleaning, sorting seed', chapter: '84' },
  { code: '8438', description: 'Machinery for food preparation', chapter: '84' },
  { code: '8439', description: 'Machinery for making paper pulp', chapter: '84' },
  { code: '8443', description: 'Printing machinery, printers', chapter: '84' },
  { code: '8450', description: 'Household or laundry washing machines', chapter: '84' },
  { code: '8451', description: 'Machinery for washing, drying textiles', chapter: '84' },
  { code: '8452', description: 'Sewing machines', chapter: '84' },
  { code: '8456', description: 'Machine-tools operated by laser', chapter: '84' },
  { code: '8457', description: 'Machining centres', chapter: '84' },
  { code: '8458', description: 'Lathes for removing metal', chapter: '84' },
  { code: '8471', description: 'Automatic data processing machines', chapter: '84' },
  { code: '8473', description: 'Parts for office machines', chapter: '84' },
  { code: '8474', description: 'Machinery for sorting, screening', chapter: '84' },
  { code: '8477', description: 'Machinery for working rubber, plastics', chapter: '84' },
  { code: '8479', description: 'Machines with individual functions', chapter: '84' },
  { code: '8480', description: 'Moulding boxes for metal foundry', chapter: '84' },
  { code: '8481', description: 'Taps, cocks, valves', chapter: '84' },
  { code: '8482', description: 'Ball or roller bearings', chapter: '84' },
  { code: '8483', description: 'Transmission shafts, gears', chapter: '84' },
  { code: '8484', description: 'Gaskets, mechanical seals', chapter: '84' },

  // Chapter 85: Electrical Equipment
  { code: '8501', description: 'Electric motors and generators', chapter: '85' },
  { code: '8502', description: 'Electric generating sets', chapter: '85' },
  { code: '8503', description: 'Parts for electric motors', chapter: '85' },
  { code: '8504', description: 'Electrical transformers, converters', chapter: '85' },
  { code: '8505', description: 'Electromagnets, permanent magnets', chapter: '85' },
  { code: '8506', description: 'Primary cells and batteries', chapter: '85' },
  { code: '8507', description: 'Electric accumulators', chapter: '85' },
  { code: '8508', description: 'Vacuum cleaners', chapter: '85' },
  { code: '8509', description: 'Electro-mechanical domestic appliances', chapter: '85' },
  { code: '8510', description: 'Shavers, hair clippers', chapter: '85' },
  { code: '8511', description: 'Electrical ignition equipment', chapter: '85' },
  { code: '8512', description: 'Electrical lighting for vehicles', chapter: '85' },
  { code: '8513', description: 'Portable electric lamps', chapter: '85' },
  { code: '8514', description: 'Industrial or laboratory electric furnaces', chapter: '85' },
  { code: '8515', description: 'Electric soldering, welding machines', chapter: '85' },
  { code: '8516', description: 'Electric water heaters, hair dryers', chapter: '85' },
  { code: '8517', description: 'Telephones, smartphones, transmission apparatus', chapter: '85' },
  { code: '8518', description: 'Microphones, loudspeakers, headphones', chapter: '85' },
  { code: '8519', description: 'Sound recording apparatus', chapter: '85' },
  { code: '8521', description: 'Video recording apparatus', chapter: '85' },
  { code: '8523', description: 'Discs, tapes, solid-state storage', chapter: '85' },
  { code: '8525', description: 'Transmission apparatus, TV cameras', chapter: '85' },
  { code: '8526', description: 'Radar apparatus, radio navigational aid', chapter: '85' },
  { code: '8527', description: 'Reception apparatus for radio', chapter: '85' },
  { code: '8528', description: 'Monitors and projectors, TV receivers', chapter: '85' },
  { code: '8529', description: 'Parts for TV, radio apparatus', chapter: '85' },
  { code: '8531', description: 'Electric sound or visual signalling', chapter: '85' },
  { code: '8532', description: 'Electrical capacitors', chapter: '85' },
  { code: '8533', description: 'Electrical resistors', chapter: '85' },
  { code: '8534', description: 'Printed circuits', chapter: '85' },
  { code: '8535', description: 'Electrical apparatus for switching', chapter: '85' },
  { code: '8536', description: 'Electrical apparatus for switching, voltage not exceeding 1000V', chapter: '85' },
  { code: '8537', description: 'Boards, panels, consoles for electric control', chapter: '85' },
  { code: '8538', description: 'Parts for electrical switching apparatus', chapter: '85' },
  { code: '8539', description: 'Electric filament or discharge lamps', chapter: '85' },
  { code: '8541', description: 'Diodes, transistors, semiconductors', chapter: '85' },
  { code: '8542', description: 'Electronic integrated circuits', chapter: '85' },
  { code: '8544', description: 'Insulated wire, cable, optical fibre cables', chapter: '85' },
  { code: '8545', description: 'Carbon electrodes, brushes', chapter: '85' },
  { code: '8546', description: 'Electrical insulators', chapter: '85' },
  { code: '8548', description: 'Waste and scrap of primary cells', chapter: '85' },

  // Chapter 86-89: Vehicles, Aircraft, Ships
  { code: '8601', description: 'Rail locomotives powered from external source', chapter: '86' },
  { code: '8602', description: 'Other rail locomotives', chapter: '86' },
  { code: '8603', description: 'Self-propelled railway coaches', chapter: '86' },
  { code: '8604', description: 'Railway maintenance vehicles', chapter: '86' },
  { code: '8605', description: 'Railway passenger coaches', chapter: '86' },
  { code: '8606', description: 'Railway freight wagons', chapter: '86' },
  { code: '8607', description: 'Parts of railway locomotives', chapter: '86' },
  { code: '8608', description: 'Railway track fixtures, signals', chapter: '86' },
  { code: '8609', description: 'Containers for transport', chapter: '86' },
  { code: '8701', description: 'Tractors', chapter: '87' },
  { code: '8702', description: 'Motor vehicles for transport of 10+ persons', chapter: '87' },
  { code: '8703', description: 'Motor cars and vehicles for transport of persons', chapter: '87' },
  { code: '8704', description: 'Motor vehicles for transport of goods', chapter: '87' },
  { code: '8705', description: 'Special purpose motor vehicles', chapter: '87' },
  { code: '8706', description: 'Chassis fitted with engines', chapter: '87' },
  { code: '8707', description: 'Bodies for motor vehicles', chapter: '87' },
  { code: '8708', description: 'Parts and accessories of motor vehicles', chapter: '87' },
  { code: '8709', description: 'Works trucks, self-propelled', chapter: '87' },
  { code: '8711', description: 'Motorcycles, cycles with auxiliary motor', chapter: '87' },
  { code: '8712', description: 'Bicycles and other cycles', chapter: '87' },
  { code: '8713', description: 'Carriages for disabled persons', chapter: '87' },
  { code: '8714', description: 'Parts for bicycles, motorcycles', chapter: '87' },
  { code: '8716', description: 'Trailers and semi-trailers', chapter: '87' },
  { code: '8801', description: 'Balloons, dirigibles, gliders', chapter: '88' },
  { code: '8802', description: 'Aircraft, spacecraft', chapter: '88' },
  { code: '8803', description: 'Parts of aircraft', chapter: '88' },
  { code: '8901', description: 'Cruise ships, cargo ships, ferries', chapter: '89' },
  { code: '8903', description: 'Yachts and vessels for pleasure', chapter: '89' },
  { code: '8905', description: 'Light-vessels, dredgers, floating docks', chapter: '89' },

  // Chapter 90-92: Instruments, Clocks, Musical
  { code: '9001', description: 'Optical fibres, lenses, prisms', chapter: '90' },
  { code: '9002', description: 'Lenses, prisms, mirrors', chapter: '90' },
  { code: '9003', description: 'Frames and mountings for spectacles', chapter: '90' },
  { code: '9004', description: 'Spectacles, goggles', chapter: '90' },
  { code: '9005', description: 'Binoculars, monoculars, telescopes', chapter: '90' },
  { code: '9006', description: 'Photographic cameras', chapter: '90' },
  { code: '9007', description: 'Cinematographic cameras, projectors', chapter: '90' },
  { code: '9008', description: 'Image projectors', chapter: '90' },
  { code: '9010', description: 'Photographic laboratory apparatus', chapter: '90' },
  { code: '9011', description: 'Compound optical microscopes', chapter: '90' },
  { code: '9012', description: 'Microscopes other than optical', chapter: '90' },
  { code: '9013', description: 'Liquid crystal devices, lasers', chapter: '90' },
  { code: '9014', description: 'Direction finding compasses', chapter: '90' },
  { code: '9015', description: 'Surveying, hydrographic instruments', chapter: '90' },
  { code: '9016', description: 'Balances of sensitivity', chapter: '90' },
  { code: '9017', description: 'Drawing, calculating instruments', chapter: '90' },
  { code: '9018', description: 'Instruments for medical, surgical use', chapter: '90' },
  { code: '9019', description: 'Mechano-therapy appliances', chapter: '90' },
  { code: '9020', description: 'Other breathing appliances', chapter: '90' },
  { code: '9021', description: 'Orthopaedic appliances', chapter: '90' },
  { code: '9022', description: 'Apparatus based on X-rays', chapter: '90' },
  { code: '9023', description: 'Instruments for demonstration', chapter: '90' },
  { code: '9024', description: 'Machines for testing materials', chapter: '90' },
  { code: '9025', description: 'Hydrometers, thermometers', chapter: '90' },
  { code: '9026', description: 'Instruments for measuring flow', chapter: '90' },
  { code: '9027', description: 'Instruments for physical or chemical analysis', chapter: '90' },
  { code: '9028', description: 'Gas, liquid, electricity meters', chapter: '90' },
  { code: '9029', description: 'Revolution counters, speedometers', chapter: '90' },
  { code: '9030', description: 'Oscilloscopes, spectrum analyzers', chapter: '90' },
  { code: '9031', description: 'Measuring or checking instruments', chapter: '90' },
  { code: '9032', description: 'Automatic regulating instruments', chapter: '90' },
  { code: '9033', description: 'Parts for machines of Chapter 90', chapter: '90' },
  { code: '9101', description: 'Wrist-watches, precious metal case', chapter: '91' },
  { code: '9102', description: 'Wrist-watches, other than precious metal', chapter: '91' },
  { code: '9103', description: 'Clocks with watch movements', chapter: '91' },
  { code: '9104', description: 'Instrument panel clocks', chapter: '91' },
  { code: '9105', description: 'Other clocks', chapter: '91' },
  { code: '9106', description: 'Time of day recording apparatus', chapter: '91' },
  { code: '9107', description: 'Time switches', chapter: '91' },
  { code: '9108', description: 'Watch movements, complete', chapter: '91' },
  { code: '9109', description: 'Clock movements, complete', chapter: '91' },
  { code: '9110', description: 'Complete watch or clock movements', chapter: '91' },
  { code: '9111', description: 'Watch cases and parts', chapter: '91' },
  { code: '9112', description: 'Clock cases and parts', chapter: '91' },
  { code: '9113', description: 'Watch straps, bands, bracelets', chapter: '91' },
  { code: '9114', description: 'Other clock or watch parts', chapter: '91' },
  { code: '9201', description: 'Pianos', chapter: '92' },
  { code: '9202', description: 'String musical instruments', chapter: '92' },
  { code: '9205', description: 'Wind musical instruments', chapter: '92' },
  { code: '9206', description: 'Percussion musical instruments', chapter: '92' },
  { code: '9207', description: 'Musical instruments, electric', chapter: '92' },
  { code: '9208', description: 'Musical boxes, fairground organs', chapter: '92' },
  { code: '9209', description: 'Parts for musical instruments', chapter: '92' },

  // Chapter 93: Arms and Ammunition
  { code: '9301', description: 'Military weapons', chapter: '93' },
  { code: '9302', description: 'Revolvers and pistols', chapter: '93' },
  { code: '9303', description: 'Other firearms', chapter: '93' },
  { code: '9304', description: 'Spring, air or gas guns', chapter: '93' },
  { code: '9305', description: 'Parts for weapons', chapter: '93' },
  { code: '9306', description: 'Bombs, grenades, ammunition', chapter: '93' },
  { code: '9307', description: 'Swords, bayonets, lances', chapter: '93' },

  // Chapter 94-96: Furniture, Toys, Miscellaneous
  { code: '9401', description: 'Seats', chapter: '94' },
  { code: '9402', description: 'Medical, surgical furniture', chapter: '94' },
  { code: '9403', description: 'Other furniture', chapter: '94' },
  { code: '9404', description: 'Mattress supports, mattresses', chapter: '94' },
  { code: '9405', description: 'Lamps and lighting fittings', chapter: '94' },
  { code: '9406', description: 'Prefabricated buildings', chapter: '94' },
  { code: '9501', description: 'Wheeled toys, dolls carriages', chapter: '95' },
  { code: '9503', description: 'Tricycles, scooters, pedal cars, dolls', chapter: '95' },
  { code: '9504', description: 'Video game consoles and machines', chapter: '95' },
  { code: '9505', description: 'Festive, carnival, magic articles', chapter: '95' },
  { code: '9506', description: 'Sports equipment', chapter: '95' },
  { code: '9507', description: 'Fishing rods, fish-hooks', chapter: '95' },
  { code: '9508', description: 'Travelling circuses, amusement parks', chapter: '95' },
  { code: '9601', description: 'Worked ivory, bone, tortoise-shell', chapter: '96' },
  { code: '9602', description: 'Worked vegetable or mineral carving', chapter: '96' },
  { code: '9603', description: 'Brooms, brushes, mops', chapter: '96' },
  { code: '9604', description: 'Hand sieves and hand riddles', chapter: '96' },
  { code: '9605', description: 'Travel sets for personal toilet', chapter: '96' },
  { code: '9606', description: 'Buttons, press-fasteners, snap-fasteners', chapter: '96' },
  { code: '9607', description: 'Slide fasteners and parts', chapter: '96' },
  { code: '9608', description: 'Ball point pens, felt tipped pens', chapter: '96' },
  { code: '9609', description: 'Pencils, crayons', chapter: '96' },
  { code: '9610', description: 'Slates and boards for writing', chapter: '96' },
  { code: '9611', description: 'Date, sealing stamps', chapter: '96' },
  { code: '9612', description: 'Typewriter or similar ribbons', chapter: '96' },
  { code: '9613', description: 'Cigarette lighters', chapter: '96' },
  { code: '9614', description: 'Smoking pipes', chapter: '96' },
  { code: '9615', description: 'Combs, hair-slides', chapter: '96' },
  { code: '9616', description: 'Scent sprayers', chapter: '96' },
  { code: '9617', description: 'Vacuum flasks', chapter: '96' },
  { code: '9618', description: 'Tailors\' dummies', chapter: '96' },

  // Chapter 97-99: Works of Art, Special
  { code: '9701', description: 'Paintings, drawings, pastels', chapter: '97' },
  { code: '9702', description: 'Original engravings, prints', chapter: '97' },
  { code: '9703', description: 'Original sculptures, statuettes', chapter: '97' },
  { code: '9704', description: 'Postage stamps, revenue stamps', chapter: '97' },
  { code: '9705', description: 'Collections of zoological interest', chapter: '97' },
  { code: '9706', description: 'Antiques over 100 years old', chapter: '97' },
  { code: '9801', description: 'Project imports', chapter: '98' },
  { code: '9802', description: 'Laboratory chemicals', chapter: '98' },
  { code: '9803', description: 'Passenger baggage', chapter: '98' },
  { code: '9804', description: 'All duty free imports', chapter: '98' },
  { code: '9901', description: 'Confidential items', chapter: '99' },
  { code: '9962', description: 'SAC - Software development services', chapter: '99' },
  { code: '9963', description: 'SAC - Leasing or rental services', chapter: '99' },
  { code: '9964', description: 'SAC - Passenger transport services', chapter: '99' },
  { code: '9965', description: 'SAC - Goods transport services', chapter: '99' },
  { code: '9966', description: 'SAC - Vehicle rental services', chapter: '99' },
  { code: '9967', description: 'SAC - Supporting services for transport', chapter: '99' },
  { code: '9968', description: 'SAC - Postal and courier services', chapter: '99' },
  { code: '9969', description: 'SAC - Electricity transmission services', chapter: '99' },
  { code: '9971', description: 'SAC - Financial services', chapter: '99' },
  { code: '9972', description: 'SAC - Real estate services', chapter: '99' },
  { code: '9973', description: 'SAC - Leasing services', chapter: '99' },
  { code: '9981', description: 'SAC - Research services', chapter: '99' },
  { code: '9982', description: 'SAC - Legal and accounting services', chapter: '99' },
  { code: '9983', description: 'SAC - Other professional services', chapter: '99' },
  { code: '9984', description: 'SAC - Telecommunication services', chapter: '99' },
  { code: '9985', description: 'SAC - Support services', chapter: '99' },
  { code: '9986', description: 'SAC - Government services', chapter: '99' },
  { code: '9987', description: 'SAC - Maintenance and repair services', chapter: '99' },
  { code: '9988', description: 'SAC - Manufacturing services', chapter: '99' },
  { code: '9989', description: 'SAC - Other manufacturing services', chapter: '99' },
  { code: '9991', description: 'SAC - Public administration services', chapter: '99' },
  { code: '9992', description: 'SAC - Education services', chapter: '99' },
  { code: '9993', description: 'SAC - Health and social services', chapter: '99' },
  { code: '9994', description: 'SAC - Sewage and waste services', chapter: '99' },
  { code: '9995', description: 'SAC - Membership organization services', chapter: '99' },
  { code: '9996', description: 'SAC - Recreation and sporting services', chapter: '99' },
  { code: '9997', description: 'SAC - Other services', chapter: '99' },
];

export interface HsnCode {
  code: string;
  description: string;
  chapter: string;
}

export class ItemsService {
  /**
   * Search HSN codes by code or description
   */
  async searchHsnCodes(query: string, limit: number = 20): Promise<HsnCode[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();

    const results = HSN_CODES_DATA.filter(hsn =>
      hsn.code.toLowerCase().includes(searchTerm) ||
      hsn.description.toLowerCase().includes(searchTerm)
    );

    // Sort by relevance: exact code match first, then code starts with, then description matches
    results.sort((a, b) => {
      const aCodeExact = a.code.toLowerCase() === searchTerm;
      const bCodeExact = b.code.toLowerCase() === searchTerm;
      if (aCodeExact && !bCodeExact) return -1;
      if (!aCodeExact && bCodeExact) return 1;

      const aCodeStarts = a.code.toLowerCase().startsWith(searchTerm);
      const bCodeStarts = b.code.toLowerCase().startsWith(searchTerm);
      if (aCodeStarts && !bCodeStarts) return -1;
      if (!aCodeStarts && bCodeStarts) return 1;

      return a.code.localeCompare(b.code);
    });

    return results.slice(0, limit);
  }
  /**
   * Generate a new SKU automatically
   */
  async generateSku(): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin
        .from('items')
        .select('sku')
        .not('sku', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        return 'SKU-0001';
      }

      // Find the highest SKU number matching SKU-XXXX format
      let maxNum = 0;
      for (const item of data) {
        const match = item.sku?.match(/^SKU-(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      }

      const nextNum = maxNum + 1;
      return `SKU-${nextNum.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating SKU:', error);
      throw error;
    }
  }

  /**
   * Get all product categories
   */
  async getCategories() {
    const { data, error } = await supabaseAdmin
      .from('product_categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Create a product category
   */
  async createCategory(name: string) {
    const { data, error } = await supabaseAdmin
      .from('product_categories')
      .insert({ name })
      .select('id, name')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a product category
   */
  async deleteCategory(id: string) {
    // Check if any items use this category
    const { data: items } = await supabaseAdmin
      .from('items')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (items && items.length > 0) {
      throw new Error('Cannot delete category that has items assigned to it');
    }

    // Delete subcategories first
    await supabaseAdmin
      .from('product_subcategories')
      .delete()
      .eq('category_id', id);

    const { data, error } = await supabaseAdmin
      .from('product_categories')
      .delete()
      .eq('id', id)
      .select('id, name')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all subcategories across all categories
   */
  async getAllSubcategories() {
    const { data, error } = await supabaseAdmin
      .from('product_subcategories')
      .select('id, name, category_id')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Get subcategories for a category
   */
  async getSubcategories(categoryId: string) {
    const { data, error } = await supabaseAdmin
      .from('product_subcategories')
      .select('id, name, category_id')
      .eq('category_id', categoryId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Create a subcategory
   */
  async createSubcategory(categoryId: string, name: string) {
    const { data, error } = await supabaseAdmin
      .from('product_subcategories')
      .insert({ category_id: categoryId, name })
      .select('id, name, category_id')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a subcategory
   */
  async deleteSubcategory(id: string) {
    // Clear subcategory_id from items that use it
    await supabaseAdmin
      .from('items')
      .update({ subcategory_id: null })
      .eq('subcategory_id', id);

    const { data, error } = await supabaseAdmin
      .from('product_subcategories')
      .delete()
      .eq('id', id)
      .select('id, name')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all items with optional filters
   */
  async getAllItems(filters?: {
    category?: string;
    isActive?: boolean;
    lowStock?: boolean;
  }) {
    let query = supabaseAdmin
      .from('items')
      .select(`
        id,
        item_name,
        sku,
        unit_price,
        cost_price,
        current_stock,
        reorder_point,
        unit_of_measurement,
        is_active,
        advanced_tracking_type,
        color,
        variant,
        size,
        product_categories (name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Apply low stock filter if requested
    if (filters?.lowStock) {
      return data.filter(item => item.current_stock <= item.reorder_point);
    }

    return data;
  }

  /**
   * Get item by ID
   */
  async getItemById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get bins that contain this item (via bill_item_bin_allocations)
   */
  async getItemBins(itemId: string) {
    // Find bill_items for this item
    const { data: billItems, error: billItemsError } = await supabaseAdmin
      .from('bill_items')
      .select('id')
      .eq('item_id', itemId);

    if (billItemsError) throw billItemsError;

    if (!billItems || billItems.length === 0) {
      return [];
    }

    const billItemIds = billItems.map(bi => bi.id);

    // Get bin allocations for these bill items
    const { data: allocations, error: allocError } = await supabaseAdmin
      .from('bill_item_bin_allocations')
      .select(`
        quantity,
        bin_location_id,
        bin_locations (id, bin_code, location_id, description)
      `)
      .in('bill_item_id', billItemIds);

    if (allocError) throw allocError;

    // Aggregate by bin
    const binMap = new Map<string, { bin_code: string; total_quantity: number; bin_location_id: string }>();

    for (const alloc of allocations || []) {
      const bin = (alloc as any).bin_locations;
      if (!bin) continue;

      const existing = binMap.get(bin.id);
      if (existing) {
        existing.total_quantity += Number(alloc.quantity) || 0;
      } else {
        binMap.set(bin.id, {
          bin_location_id: bin.id,
          bin_code: bin.bin_code,
          total_quantity: Number(alloc.quantity) || 0,
        });
      }
    }

    return Array.from(binMap.values());
  }

  /**
   * Get items summary
   */
  async getItemsSummary() {
    const { data, error } = await supabaseAdmin
      .from('items')
      .select('current_stock, reorder_point, is_active, unit_price');

    if (error) throw error;

    const totalItems = data.length;
    const activeItems = data.filter(item => item.is_active).length;
    const lowStockItems = data.filter(item => item.current_stock <= item.reorder_point).length;
    const totalValue = data.reduce((sum, item) => sum + (item.current_stock * item.unit_price), 0);

    return {
      totalItems,
      activeItems,
      lowStockItems,
      totalValue,
      currency: 'INR'
    };
  }

  /**
   * Get top selling items
   */
  async getTopSellingItems(limit = 10) {
    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .select('id, product_name, sales_count, unit_price')
      .order('sales_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Create a new item
   */
  async createItem(itemData: any) {
    // Get organization_id (default to first organization)
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    const newItem = {
      organization_id: org?.id,
      item_name: itemData.name,
      item_type: itemData.item_type || 'goods',
      size: itemData.size || null,
      color: itemData.color || null,
      variant: itemData.variant || null,
      sku: itemData.sku,
      unit_of_measurement: itemData.unit,
      category_id: itemData.category || null,
      subcategory_id: itemData.subcategory || null,
      description: itemData.description || null,
      unit_price: parseFloat(itemData.unit_price) || 0,
      cost_price: parseFloat(itemData.cost_price) || 0,
      current_stock: parseInt(itemData.current_stock) || 0,
      reorder_point: itemData.reorder_point !== undefined && itemData.reorder_point !== null ? parseInt(itemData.reorder_point) : 0,
      max_stock: parseInt(itemData.max_stock) || null,
      manufacturer: itemData.manufacturer || null,
      weight: parseFloat(itemData.weight) || null,
      dimensions: itemData.dimensions || null,
      is_active: itemData.is_active !== false,
      tax_rate: parseFloat(itemData.tax_rate) || 0,
      image_url: itemData.image_url || null,
      hsn_code: itemData.hsn_code || null,
      brand: itemData.brand || null,
      upc: itemData.upc || null,
      mpn: itemData.mpn || null,
      ean: itemData.ean || null,
      isbn: itemData.isbn || null,
      is_returnable: itemData.is_returnable || false,

      // Sales Information
      is_sellable: itemData.is_sellable !== false,
      selling_price: itemData.selling_price ? parseFloat(itemData.selling_price) : null,
      sales_account: itemData.sales_account || null,
      sales_description: itemData.sales_description || null,

      // Purchase Information
      is_purchasable: itemData.is_purchasable !== false,
      purchase_account: itemData.purchase_account || null,
      purchase_description: itemData.purchase_description || null,
      preferred_vendor_id: itemData.preferred_vendor_id || null,

      // Inventory Tracking
      track_inventory: itemData.track_inventory !== false,
      track_bin_location: itemData.track_bin_location || false,
      advanced_tracking_type: itemData.advanced_tracking_type || 'none',
      inventory_account: itemData.inventory_account || null,
      valuation_method: itemData.valuation_method || null,

      // Premium & Incentive
      is_premium_tagged: itemData.is_premium_tagged || false,
      incentive_type: itemData.incentive_type || null
    };

    const { data, error } = await supabaseAdmin
      .from('items')
      .insert(newItem)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing item
   */
  async updateItem(id: string, itemData: any) {
    // Map frontend field names to database column names (same as createItem)
    const updateData: any = {};

    // Only include fields that are actually being updated
    if (itemData.name !== undefined) {
      console.log('Updating item name from:', itemData.name);
      updateData.item_name = itemData.name;
    }
    if (itemData.item_type !== undefined) updateData.item_type = itemData.item_type;
    if (itemData.size !== undefined) updateData.size = itemData.size || null;
    if (itemData.color !== undefined) updateData.color = itemData.color || null;
    if (itemData.variant !== undefined) updateData.variant = itemData.variant || null;
    if (itemData.sku !== undefined) updateData.sku = itemData.sku;
    if (itemData.unit !== undefined) updateData.unit_of_measurement = itemData.unit;
    if (itemData.category !== undefined) updateData.category_id = itemData.category || null;
    if (itemData.subcategory !== undefined) updateData.subcategory_id = itemData.subcategory || null;
    if (itemData.description !== undefined) updateData.description = itemData.description || null;
    if (itemData.unit_price !== undefined) updateData.unit_price = parseFloat(itemData.unit_price) || 0;
    if (itemData.cost_price !== undefined) updateData.cost_price = parseFloat(itemData.cost_price) || 0;
    if (itemData.current_stock !== undefined) updateData.current_stock = parseInt(itemData.current_stock) || 0;
    if (itemData.reorder_point !== undefined) updateData.reorder_point = parseInt(itemData.reorder_point) || 0;
    if (itemData.max_stock !== undefined) updateData.max_stock = parseInt(itemData.max_stock) || null;
    if (itemData.manufacturer !== undefined) updateData.manufacturer = itemData.manufacturer || null;
    if (itemData.weight !== undefined) updateData.weight = parseFloat(itemData.weight) || null;
    if (itemData.dimensions !== undefined) updateData.dimensions = itemData.dimensions || null;
    if (itemData.is_active !== undefined) updateData.is_active = itemData.is_active;
    if (itemData.tax_rate !== undefined) updateData.tax_rate = parseFloat(itemData.tax_rate) || 0;
    if (itemData.image_url !== undefined) updateData.image_url = itemData.image_url || null;
    if (itemData.hsn_code !== undefined) updateData.hsn_code = itemData.hsn_code || null;
    if (itemData.brand !== undefined) updateData.brand = itemData.brand || null;
    if (itemData.upc !== undefined) updateData.upc = itemData.upc || null;
    if (itemData.mpn !== undefined) updateData.mpn = itemData.mpn || null;
    if (itemData.ean !== undefined) updateData.ean = itemData.ean || null;
    if (itemData.isbn !== undefined) updateData.isbn = itemData.isbn || null;
    if (itemData.is_returnable !== undefined) updateData.is_returnable = itemData.is_returnable || false;

    // Sales Information
    if (itemData.is_sellable !== undefined) updateData.is_sellable = itemData.is_sellable;
    if (itemData.selling_price !== undefined) updateData.selling_price = itemData.selling_price ? parseFloat(itemData.selling_price) : null;
    if (itemData.sales_account !== undefined) updateData.sales_account = itemData.sales_account || null;
    if (itemData.sales_description !== undefined) updateData.sales_description = itemData.sales_description || null;

    // Purchase Information
    if (itemData.is_purchasable !== undefined) updateData.is_purchasable = itemData.is_purchasable;
    if (itemData.purchase_account !== undefined) updateData.purchase_account = itemData.purchase_account || null;
    if (itemData.purchase_description !== undefined) updateData.purchase_description = itemData.purchase_description || null;
    if (itemData.preferred_vendor_id !== undefined) updateData.preferred_vendor_id = itemData.preferred_vendor_id || null;

    // Inventory Tracking
    if (itemData.track_inventory !== undefined) updateData.track_inventory = itemData.track_inventory;
    if (itemData.track_bin_location !== undefined) updateData.track_bin_location = itemData.track_bin_location || false;
    if (itemData.advanced_tracking_type !== undefined) updateData.advanced_tracking_type = itemData.advanced_tracking_type || 'none';
    if (itemData.inventory_account !== undefined) updateData.inventory_account = itemData.inventory_account || null;
    if (itemData.valuation_method !== undefined) updateData.valuation_method = itemData.valuation_method || null;

    // Premium & Incentive
    if (itemData.is_premium_tagged !== undefined) updateData.is_premium_tagged = itemData.is_premium_tagged;
    if (itemData.incentive_type !== undefined) updateData.incentive_type = itemData.incentive_type || null;

    console.log('Update data being sent:', updateData);

    const { data, error } = await supabaseAdmin
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    console.log('Updated item data returned:', data);
    return data;
  }

  /**
   * Delete an item (soft delete by marking as inactive)
   */
  async deleteItem(id: string) {
    const { data, error } = await supabaseAdmin
      .from('items')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Bulk create items from import
   */
  async bulkCreateItems(itemsData: any[], skipDuplicates: boolean = true) {
    const results = {
      successful: [] as any[],
      failed: [] as { row: number; sku: string; error: string }[],
      duplicates: [] as string[]
    };

    for (let i = 0; i < itemsData.length; i++) {
      try {
        if (skipDuplicates && itemsData[i].sku) {
          const { data: existing } = await supabaseAdmin
            .from('items')
            .select('sku')
            .eq('sku', itemsData[i].sku)
            .single();

          if (existing) {
            results.duplicates.push(itemsData[i].sku);
            continue;
          }
        }

        const created = await this.createItem(itemsData[i]);
        results.successful.push(created);
      } catch (error: any) {
        results.failed.push({
          row: i + 2,
          sku: itemsData[i].sku || 'N/A',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Bulk update items
   */
  async bulkUpdateItems(itemsData: any[]) {
    const results = {
      successful: [] as any[],
      failed: [] as { row: number; sku: string; error: string }[],
      notFound: [] as string[]
    };

    for (let i = 0; i < itemsData.length; i++) {
      try {
        const { data: existing } = await supabaseAdmin
          .from('items')
          .select('id')
          .eq('sku', itemsData[i].sku)
          .single();

        if (!existing) {
          results.notFound.push(itemsData[i].sku);
          continue;
        }

        const updated = await this.updateItem(existing.id, itemsData[i]);
        results.successful.push(updated);
      } catch (error: any) {
        results.failed.push({
          row: i + 2,
          sku: itemsData[i].sku || 'N/A',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get item by barcode (searches barcode, sku, upc, ean, isbn, serial_numbers)
   */
  async getItemByBarcode(barcode: string) {
    // Try SKU first
    let { data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('sku', barcode)
      .limit(1);

    if (error) throw error;
    if (data && data.length > 0) return { ...data[0], matched_serial: null };

    // Try UPC
    ({ data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('upc', barcode)
      .limit(1));

    if (error) throw error;
    if (data && data.length > 0) return { ...data[0], matched_serial: null };

    // Try EAN
    ({ data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('ean', barcode)
      .limit(1));

    if (error) throw error;
    if (data && data.length > 0) return { ...data[0], matched_serial: null };

    // Try ISBN
    ({ data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('isbn', barcode)
      .limit(1));

    if (error) throw error;
    if (data && data.length > 0) return { ...data[0], matched_serial: null };

    // Try serial number lookup in bill_items (include id for bin allocation lookup)
    const { data: billItems, error: billError } = await supabaseAdmin
      .from('bill_items')
      .select('id, item_id, item_name, serial_numbers')
      .not('serial_numbers', 'eq', '[]');

    if (!billError && billItems) {
      for (const billItem of billItems) {
        const serials = billItem.serial_numbers || [];
        if (serials.includes(barcode)) {
          // Look up which bin this bill_item was allocated to
          let serial_bin = null;
          const { data: binAlloc } = await supabaseAdmin
            .from('bill_item_bin_allocations')
            .select('bin_location_id, quantity, bin_locations(id, bin_code, location_id, locations(name))')
            .eq('bill_item_id', billItem.id)
            .limit(1)
            .single();
          if (binAlloc) {
            const loc = binAlloc.bin_locations as any;
            serial_bin = {
              bin_location_id: binAlloc.bin_location_id,
              bin_code: loc?.bin_code,
              location_name: loc?.locations?.name || null,
              quantity: binAlloc.quantity,
            };
          }

          // Found the serial number, get the full item
          if (billItem.item_id) {
            const { data: item } = await supabaseAdmin
              .from('items')
              .select('*')
              .eq('id', billItem.item_id)
              .single();
            if (item) {
              return { ...item, matched_serial: barcode, serial_bin };
            }
          }
          // Return minimal info if no item_id
          return {
            id: billItem.item_id,
            item_name: billItem.item_name,
            matched_serial: barcode,
            serial_bin,
          };
        }
      }
    }

    // Try stripping serial suffix (e.g. "SKU-0031/1" → "SKU-0031") for label barcodes
    const slashIdx = barcode.lastIndexOf('/');
    if (slashIdx > 0) {
      const baseSku = barcode.substring(0, slashIdx);
      const { data: skuData, error: skuError } = await supabaseAdmin
        .from('items')
        .select('*')
        .eq('sku', baseSku)
        .limit(1);

      if (!skuError && skuData && skuData.length > 0) {
        return { ...skuData[0], matched_serial: null };
      }
    }

    return null;
  }

  /**
   * Export items
   */
  async exportItems(filters?: { includeInactive?: boolean; itemIds?: string[] }) {
    let query = supabaseAdmin
      .from('items')
      .select('*')
      .order('item_name', { ascending: true });

    if (!filters?.includeInactive) {
      query = query.eq('is_active', true);
    }

    if (filters?.itemIds && filters.itemIds.length > 0) {
      query = query.in('id', filters.itemIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

}
