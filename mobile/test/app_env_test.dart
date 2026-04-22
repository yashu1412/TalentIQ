import 'package:flutter_test/flutter_test.dart';
import 'package:talentiq_mobile/app/env.dart';

void main() {
  test('defaults to dev flavor', () {
    AppEnv.setFlavor('');
    expect(AppEnv.flavor, 'dev');
    expect(AppEnv.isProduction, false);
  });

  test('sets production flavor', () {
    AppEnv.setFlavor('prod');
    expect(AppEnv.flavor, 'prod');
    expect(AppEnv.isProduction, true);
  });
}
