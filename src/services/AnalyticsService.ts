
export class AnalyticsService {
  static track(_eventName: string, _properties?: Record<string, string | number | boolean>): void {
    // MVPでは外部送信しない。将来Supabaseや分析基盤を接続するためのplaceholder。
  }
}
