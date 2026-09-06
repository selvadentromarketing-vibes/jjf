// Field vitals by tier (plan §11): LCP / CLS / INP beacon to GA4 with in_app and tier dimensions.
import { onLCP, onCLS, onINP, type Metric } from 'web-vitals';
import { track } from './analytics';

export function initVitals() {
  const send = (m: Metric) => track('web_vitals', {
    metric_name: m.name,
    metric_value: Math.round(m.name === 'CLS' ? m.value * 1000 : m.value),
    metric_rating: m.rating,
    metric_id: m.id,
    in_app: document.documentElement.dataset.tier === 'in_app',
  });
  onLCP(send); onCLS(send); onINP(send);
}
