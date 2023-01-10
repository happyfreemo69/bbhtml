mocha=./node_modules/mocha/bin/_mocha --recursive
folders=lib
dirs=$(addprefix tests/,$(folders))
.PHONY: tests $(folders) readme
test: $(folders)
lib:
	@$(mocha) tests/lib

#http://stackoverflow.com/questions/6273608/how-to-pass-argument-to-makefile-from-command-line
custom:
	@$(mocha) $(filter-out $@,$(MAKECMDGOALS))

%:
	@:

readme:
	./doc/generate.sh

jenkins:
	@$(mocha) --reporter mocha-jenkins-reporter --colors --reporter-options junit_report_path=./test-reports/report.xml $(dirs)