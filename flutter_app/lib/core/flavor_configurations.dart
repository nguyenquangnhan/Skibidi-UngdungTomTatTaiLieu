enum ConfigurationProfile {
  development(
    baseUrl: 'http://10.0.2.2:8000',
    name: 'development',
  ),
  staging(
    baseUrl: 'http://10.0.2.2:8000',
    name: 'staging',
  ),
  production(
    baseUrl: 'https://your-production-api.com',
    name: 'production',
  );

  final String baseUrl;
  final int connectTimeout = _defaultConnectTimeout;
  final int receiveTimeout = _defaultReceiveTimeout;
  final int sendTimeout = _defaultSendTimeout;
  final String name;

  // Flavor things...

  const ConfigurationProfile({required this.baseUrl, required this.name});

  static const _defaultConnectTimeout = 30000;
  static const _defaultReceiveTimeout = 30000;
  static const _defaultSendTimeout = 30000;

  static ConfigurationProfile _current = ConfigurationProfile.development;

  static ConfigurationProfile get current {
    return _current;
  }

  static set current(ConfigurationProfile flavor) {
    _current = flavor;
  }
}
