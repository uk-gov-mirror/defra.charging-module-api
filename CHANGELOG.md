# Changelog

## [v0.3.0](https://github.com/DEFRA/charging-module-api/tree/v0.3.0) (2020-10-27)

[Full Changelog](https://github.com/DEFRA/charging-module-api/compare/v0.2.0...v0.3.0)

**Implemented enhancements:**

- Add database health check controller [\#126](https://github.com/DEFRA/charging-module-api/pull/126) ([Cruikshanks](https://github.com/Cruikshanks))

**Fixed bugs:**

- Fix authentication in airbrake controller [\#123](https://github.com/DEFRA/charging-module-api/pull/123) ([Cruikshanks](https://github.com/Cruikshanks))
- Fix issue with blown integers [\#120](https://github.com/DEFRA/charging-module-api/pull/120) ([Cruikshanks](https://github.com/Cruikshanks))
- Update and fix Airbrake [\#113](https://github.com/DEFRA/charging-module-api/pull/113) ([Cruikshanks](https://github.com/Cruikshanks))

**Security fixes:**

- Add disinfect plugin to santize inputs to the API [\#119](https://github.com/DEFRA/charging-module-api/pull/119) ([Cruikshanks](https://github.com/Cruikshanks))
- Enable setting common security headers [\#118](https://github.com/DEFRA/charging-module-api/pull/118) ([Cruikshanks](https://github.com/Cruikshanks))

**Merged pull requests:**

- Replace Good logging with Hapi-pino [\#137](https://github.com/DEFRA/charging-module-api/pull/137) ([Cruikshanks](https://github.com/Cruikshanks))
- Bump aws-sdk from 2.777.0 to 2.779.0 [\#136](https://github.com/DEFRA/charging-module-api/pull/136) ([dependabot[bot]](https://github.com/apps/dependabot))
- Add check for use of `only\(\)` in tests to travis [\#134](https://github.com/DEFRA/charging-module-api/pull/134) ([Cruikshanks](https://github.com/Cruikshanks))
- Unescape santized html characters [\#133](https://github.com/DEFRA/charging-module-api/pull/133) ([Cruikshanks](https://github.com/Cruikshanks))
- Bump aws-sdk from 2.774.0 to 2.777.0 [\#132](https://github.com/DEFRA/charging-module-api/pull/132) ([dependabot[bot]](https://github.com/apps/dependabot))
- Bump aws-sdk from 2.773.0 to 2.774.0 [\#129](https://github.com/DEFRA/charging-module-api/pull/129) ([dependabot[bot]](https://github.com/apps/dependabot))
- Bump nodemon from 2.0.5 to 2.0.6 [\#128](https://github.com/DEFRA/charging-module-api/pull/128) ([dependabot[bot]](https://github.com/apps/dependabot))
- Bump aws-sdk from 2.772.0 to 2.773.0 [\#127](https://github.com/DEFRA/charging-module-api/pull/127) ([dependabot[bot]](https://github.com/apps/dependabot))
- Update status handler to return simple response [\#125](https://github.com/DEFRA/charging-module-api/pull/125) ([Cruikshanks](https://github.com/Cruikshanks))
- Move /health under /admin [\#124](https://github.com/DEFRA/charging-module-api/pull/124) ([Cruikshanks](https://github.com/Cruikshanks))
- Move Airbrake controller to health path [\#122](https://github.com/DEFRA/charging-module-api/pull/122) ([Cruikshanks](https://github.com/Cruikshanks))
- Create an `/admin` root path [\#121](https://github.com/DEFRA/charging-module-api/pull/121) ([Cruikshanks](https://github.com/Cruikshanks))
- Bump aws-sdk from 2.771.0 to 2.772.0 [\#117](https://github.com/DEFRA/charging-module-api/pull/117) ([dependabot[bot]](https://github.com/apps/dependabot))
- Create Dependabot config file [\#116](https://github.com/DEFRA/charging-module-api/pull/116) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Use classes for controllers consistently [\#115](https://github.com/DEFRA/charging-module-api/pull/115) ([Cruikshanks](https://github.com/Cruikshanks))
- Bump @hapi/hapi from 20.0.0 to 20.0.1 [\#112](https://github.com/DEFRA/charging-module-api/pull/112) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- More SROC cleansing from project [\#111](https://github.com/DEFRA/charging-module-api/pull/111) ([Cruikshanks](https://github.com/Cruikshanks))
- Remove unused transaction queue controller [\#110](https://github.com/DEFRA/charging-module-api/pull/110) ([Cruikshanks](https://github.com/Cruikshanks))
- Remove endpoint suppression [\#109](https://github.com/DEFRA/charging-module-api/pull/109) ([Cruikshanks](https://github.com/Cruikshanks))
- Delete billed transactions endpoint [\#108](https://github.com/DEFRA/charging-module-api/pull/108) ([Cruikshanks](https://github.com/Cruikshanks))
- Run npm audit fix against the project [\#107](https://github.com/DEFRA/charging-module-api/pull/107) ([Cruikshanks](https://github.com/Cruikshanks))
- Bump @hapi/hapi from 18.4.0 to 20.0.0 [\#106](https://github.com/DEFRA/charging-module-api/pull/106) ([dependabot[bot]](https://github.com/apps/dependabot))
- Delete 'unused' test code [\#105](https://github.com/DEFRA/charging-module-api/pull/105) ([Cruikshanks](https://github.com/Cruikshanks))
- Delete redundant SROC code [\#104](https://github.com/DEFRA/charging-module-api/pull/104) ([Cruikshanks](https://github.com/Cruikshanks))
- Delete 'unused' code [\#103](https://github.com/DEFRA/charging-module-api/pull/103) ([Cruikshanks](https://github.com/Cruikshanks))
- Bump nodemon from 2.0.4 to 2.0.5 [\#102](https://github.com/DEFRA/charging-module-api/pull/102) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Upgrade solution to use Node v12 [\#101](https://github.com/DEFRA/charging-module-api/pull/101) ([Cruikshanks](https://github.com/Cruikshanks))
- Bump aws-sdk from 2.768.0 to 2.771.0 [\#100](https://github.com/DEFRA/charging-module-api/pull/100) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump aws-sdk from 2.767.0 to 2.768.0 [\#98](https://github.com/DEFRA/charging-module-api/pull/98) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump aws-sdk from 2.762.0 to 2.767.0 [\#97](https://github.com/DEFRA/charging-module-api/pull/97) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump aws-sdk from 2.761.0 to 2.762.0 [\#95](https://github.com/DEFRA/charging-module-api/pull/95) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump aws-sdk from 2.754.0 to 2.761.0 [\#94](https://github.com/DEFRA/charging-module-api/pull/94) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))

## [v0.2.0](https://github.com/DEFRA/charging-module-api/tree/v0.2.0) (2020-09-18)

[Full Changelog](https://github.com/DEFRA/charging-module-api/compare/v0.1.0...v0.2.0)

**Implemented enhancements:**

- Set 'calculating bill run' status when generating the bill run summary [\#79](https://github.com/DEFRA/charging-module-api/pull/79) ([StuAA78](https://github.com/StuAA78))
- Tagged endpoints not required for pre-sroc release [\#77](https://github.com/DEFRA/charging-module-api/pull/77) ([StuAA78](https://github.com/StuAA78))
- Add filtering of routes based on tags [\#69](https://github.com/DEFRA/charging-module-api/pull/69) ([StuAA78](https://github.com/StuAA78))
- Handle bill runs where all transactions have zero value [\#51](https://github.com/DEFRA/charging-module-api/pull/51) ([StuAA78](https://github.com/StuAA78))
- Zero charge transaction summary info [\#50](https://github.com/DEFRA/charging-module-api/pull/50) ([StuAA78](https://github.com/StuAA78))
- Add preSroc flag to bill run summary [\#48](https://github.com/DEFRA/charging-module-api/pull/48) ([StuAA78](https://github.com/StuAA78))
- Transactions with zero charge [\#47](https://github.com/DEFRA/charging-module-api/pull/47) ([StuAA78](https://github.com/StuAA78))

**Fixed bugs:**

- Corrected error handling for bill runs without transactions [\#89](https://github.com/DEFRA/charging-module-api/pull/89) ([StuAA78](https://github.com/StuAA78))
- Fixed zero value transactions not being added to summary when newLicence is true [\#70](https://github.com/DEFRA/charging-module-api/pull/70) ([StuAA78](https://github.com/StuAA78))
- Add check for groups with only zero value charge transactions [\#49](https://github.com/DEFRA/charging-module-api/pull/49) ([StuAA78](https://github.com/StuAA78))

**Security fixes:**

- \[Security\] Bump @hapi/ammo from 3.1.1 to 3.1.2 [\#83](https://github.com/DEFRA/charging-module-api/pull/83) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- \[Security\] Bump @hapi/accept from 3.2.3 to 3.2.4 [\#82](https://github.com/DEFRA/charging-module-api/pull/82) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- \[Security\] Bump @hapi/subtext from 6.1.2 to 6.1.3 [\#81](https://github.com/DEFRA/charging-module-api/pull/81) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- \[Security\] Bump lodash from 4.17.13 to 4.17.20 [\#59](https://github.com/DEFRA/charging-module-api/pull/59) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- \[Security\] Bump handlebars from 4.5.3 to 4.7.6 [\#56](https://github.com/DEFRA/charging-module-api/pull/56) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- \[Security\] Bump acorn from 6.2.0 to 6.4.1 [\#54](https://github.com/DEFRA/charging-module-api/pull/54) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))

**Merged pull requests:**

- Bump aws-sdk from 2.739.0 to 2.754.0 [\#90](https://github.com/DEFRA/charging-module-api/pull/90) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Replace eslint with standardjs and fix outstanding issues [\#86](https://github.com/DEFRA/charging-module-api/pull/86) ([StuAA78](https://github.com/StuAA78))
- Bump aws-sdk from 2.738.0 to 2.739.0 [\#78](https://github.com/DEFRA/charging-module-api/pull/78) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump db-migrate from 0.11.6 to 0.11.11 [\#76](https://github.com/DEFRA/charging-module-api/pull/76) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump @hapi/good-console from 8.1.0 to 8.1.2 [\#75](https://github.com/DEFRA/charging-module-api/pull/75) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump eslint from 6.1.0 to 6.8.0 [\#74](https://github.com/DEFRA/charging-module-api/pull/74) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump eslint-plugin-standard from 4.0.0 to 4.0.1 [\#73](https://github.com/DEFRA/charging-module-api/pull/73) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump pg from 7.11.0 to 7.18.2 [\#72](https://github.com/DEFRA/charging-module-api/pull/72) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump aws-sdk from 2.502.0 to 2.738.0 [\#71](https://github.com/DEFRA/charging-module-api/pull/71) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Change tmpfiles folder to tmp [\#68](https://github.com/DEFRA/charging-module-api/pull/68) ([StuAA78](https://github.com/StuAA78))
- Add support for CI [\#67](https://github.com/DEFRA/charging-module-api/pull/67) ([Cruikshanks](https://github.com/Cruikshanks))
- Add node nvm version file to project [\#66](https://github.com/DEFRA/charging-module-api/pull/66) ([Cruikshanks](https://github.com/Cruikshanks))
- Switch to using .labrc.js config file [\#65](https://github.com/DEFRA/charging-module-api/pull/65) ([Cruikshanks](https://github.com/Cruikshanks))
- Update LICENSE, README and others to meet standard [\#64](https://github.com/DEFRA/charging-module-api/pull/64) ([Cruikshanks](https://github.com/Cruikshanks))
- Merge 'Develop' into master [\#63](https://github.com/DEFRA/charging-module-api/pull/63) ([Cruikshanks](https://github.com/Cruikshanks))
- Bump db-migrate-pg from 1.0.0 to 1.2.2 [\#62](https://github.com/DEFRA/charging-module-api/pull/62) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump winston from 3.2.1 to 3.3.3 [\#61](https://github.com/DEFRA/charging-module-api/pull/61) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump eslint-plugin-node from 9.1.0 to 9.2.0 [\#60](https://github.com/DEFRA/charging-module-api/pull/60) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump @hapi/good-squeeze from 5.2.0 to 5.2.1 [\#58](https://github.com/DEFRA/charging-module-api/pull/58) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump @hapi/good from 8.2.0 to 8.2.4 [\#57](https://github.com/DEFRA/charging-module-api/pull/57) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump dotenv from 8.0.0 to 8.2.0 [\#55](https://github.com/DEFRA/charging-module-api/pull/55) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump blipp from 4.0.0 to 4.0.1 [\#53](https://github.com/DEFRA/charging-module-api/pull/53) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))
- Bump eslint-plugin-import from 2.18.2 to 2.22.0 [\#52](https://github.com/DEFRA/charging-module-api/pull/52) ([dependabot-preview[bot]](https://github.com/apps/dependabot-preview))

## [v0.1.0](https://github.com/DEFRA/charging-module-api/tree/v0.1.0) (2020-07-01)

[Full Changelog](https://github.com/DEFRA/charging-module-api/compare/98f05b5f786ccb25eb50c4dfab2056c002668e01...v0.1.0)

**Implemented enhancements:**

- Consider "New Licence" flag when allocating transactions to a Minimum Charge group [\#46](https://github.com/DEFRA/charging-module-api/pull/46) ([StuAA78](https://github.com/StuAA78))
- update schema to allow zero volume and add test [\#45](https://github.com/DEFRA/charging-module-api/pull/45) ([rudenoise](https://github.com/rudenoise))
- Exclude Invoices below De-Minimis Value from Bill Run [\#43](https://github.com/DEFRA/charging-module-api/pull/43) ([StuAA78](https://github.com/StuAA78))

**Fixed bugs:**

- bug fix for transaction file ref appearing in the view bill run trans… [\#44](https://github.com/DEFRA/charging-module-api/pull/44) ([rudenoise](https://github.com/rudenoise))

**Merged pull requests:**

- Clean up tests, fix minor defects [\#42](https://github.com/DEFRA/charging-module-api/pull/42) ([tonyheadford](https://github.com/tonyheadford))
- Fixed spurious comma problem [\#41](https://github.com/DEFRA/charging-module-api/pull/41) ([tonyheadford](https://github.com/tonyheadford))
- Fixed issue with status not being a query option [\#40](https://github.com/DEFRA/charging-module-api/pull/40) ([tonyheadford](https://github.com/tonyheadford))
- Added authorisation to controllers [\#39](https://github.com/DEFRA/charging-module-api/pull/39) ([tonyheadford](https://github.com/tonyheadford))
- Added authorisation to controllers [\#38](https://github.com/DEFRA/charging-module-api/pull/38) ([tonyheadford](https://github.com/tonyheadford))
- Added file creation date to bill run [\#37](https://github.com/DEFRA/charging-module-api/pull/37) ([tonyheadford](https://github.com/tonyheadford))
- Minimum charge [\#36](https://github.com/DEFRA/charging-module-api/pull/36) ([tonyheadford](https://github.com/tonyheadford))
- Clean up and fix for missing await statement [\#35](https://github.com/DEFRA/charging-module-api/pull/35) ([tonyheadford](https://github.com/tonyheadford))
- Added nested bill run functionality [\#34](https://github.com/DEFRA/charging-module-api/pull/34) ([tonyheadford](https://github.com/tonyheadford))
- Added endpoint for listing/searching billed transactions [\#33](https://github.com/DEFRA/charging-module-api/pull/33) ([tonyheadford](https://github.com/tonyheadford))
- Updated data validation rules [\#32](https://github.com/DEFRA/charging-module-api/pull/32) ([tonyheadford](https://github.com/tonyheadford))
- Reordered transactions in file for compensation charge [\#31](https://github.com/DEFRA/charging-module-api/pull/31) ([tonyheadford](https://github.com/tonyheadford))
- Added customer\_file\_id to bill run output [\#30](https://github.com/DEFRA/charging-module-api/pull/30) ([tonyheadford](https://github.com/tonyheadford))
- Customer archive [\#29](https://github.com/DEFRA/charging-module-api/pull/29) ([tonyheadford](https://github.com/tonyheadford))
- Changed path for transaction files [\#28](https://github.com/DEFRA/charging-module-api/pull/28) ([tonyheadford](https://github.com/tonyheadford))
- Added zero charge handling [\#27](https://github.com/DEFRA/charging-module-api/pull/27) ([tonyheadford](https://github.com/tonyheadford))
- Fixed issue with scheduler [\#26](https://github.com/DEFRA/charging-module-api/pull/26) ([tonyheadford](https://github.com/tonyheadford))
- Saving customer file reference with bill run [\#25](https://github.com/DEFRA/charging-module-api/pull/25) ([tonyheadford](https://github.com/tonyheadford))
- Customer changes [\#24](https://github.com/DEFRA/charging-module-api/pull/24) ([tonyheadford](https://github.com/tonyheadford))
- Made line\_attr\_1 blank in file when compensation charge [\#23](https://github.com/DEFRA/charging-module-api/pull/23) ([tonyheadford](https://github.com/tonyheadford))
- Added Ml suffix to volume amount in transaction file [\#22](https://github.com/DEFRA/charging-module-api/pull/22) ([tonyheadford](https://github.com/tonyheadford))
- Convert suc factor value into pence [\#21](https://github.com/DEFRA/charging-module-api/pull/21) ([tonyheadford](https://github.com/tonyheadford))
- Force prorataDays to be zero padded [\#20](https://github.com/DEFRA/charging-module-api/pull/20) ([tonyheadford](https://github.com/tonyheadford))
- Fixed issue with transaction file for compensation charge transactions [\#19](https://github.com/DEFRA/charging-module-api/pull/19) ([tonyheadford](https://github.com/tonyheadford))
- Fixed issue where chargeElementAgreement not being correctly populated [\#18](https://github.com/DEFRA/charging-module-api/pull/18) ([tonyheadford](https://github.com/tonyheadford))
- Bulk approval [\#17](https://github.com/DEFRA/charging-module-api/pull/17) ([tonyheadford](https://github.com/tonyheadford))
- Added exporting bill run to transaction file [\#16](https://github.com/DEFRA/charging-module-api/pull/16) ([tonyheadford](https://github.com/tonyheadford))
- Fixed multiple year issue [\#15](https://github.com/DEFRA/charging-module-api/pull/15) ([tonyheadford](https://github.com/tonyheadford))
- Changed condition to make zero a debit instead of a credit [\#14](https://github.com/DEFRA/charging-module-api/pull/14) ([tonyheadford](https://github.com/tonyheadford))
- Fixed issue with calculation attribute overwriting eiucSource [\#13](https://github.com/DEFRA/charging-module-api/pull/13) ([tonyheadford](https://github.com/tonyheadford))
- Added maximum perPage limit [\#12](https://github.com/DEFRA/charging-module-api/pull/12) ([tonyheadford](https://github.com/tonyheadford))
- Switched wildcard character to % from \* [\#11](https://github.com/DEFRA/charging-module-api/pull/11) ([tonyheadford](https://github.com/tonyheadford))
- Correct logic for chargeElementAgreement value [\#10](https://github.com/DEFRA/charging-module-api/pull/10) ([tonyheadford](https://github.com/tonyheadford))
- Aligned spec to version 0.12 [\#9](https://github.com/DEFRA/charging-module-api/pull/9) ([tonyheadford](https://github.com/tonyheadford))
- Billing [\#8](https://github.com/DEFRA/charging-module-api/pull/8) ([tonyheadford](https://github.com/tonyheadford))
- Added extra fields to output [\#7](https://github.com/DEFRA/charging-module-api/pull/7) ([tonyheadford](https://github.com/tonyheadford))
- Added changes to handle messages change in ruleset [\#6](https://github.com/DEFRA/charging-module-api/pull/6) ([tonyheadford](https://github.com/tonyheadford))
- Updated api to v0.10 of the spec [\#5](https://github.com/DEFRA/charging-module-api/pull/5) ([tonyheadford](https://github.com/tonyheadford))
- Connect to rules service and calculate charge [\#4](https://github.com/DEFRA/charging-module-api/pull/4) ([tonyheadford](https://github.com/tonyheadford))
- Added sroc transaction endpoints [\#3](https://github.com/DEFRA/charging-module-api/pull/3) ([tonyheadford](https://github.com/tonyheadford))
- Fix passing wrong data to extract method [\#2](https://github.com/DEFRA/charging-module-api/pull/2) ([tonyheadford](https://github.com/tonyheadford))
- Charge calc [\#1](https://github.com/DEFRA/charging-module-api/pull/1) ([tonyheadford](https://github.com/tonyheadford))



\* *This Changelog was automatically generated by [github_changelog_generator](https://github.com/github-changelog-generator/github-changelog-generator)*
