# Compliance System Integration Guide

## Overview

The compliance system has been successfully integrated into the ElmecV2 application. It provides comprehensive tracking of request flows, user activity, evidence collection, digital signatures, and tiered onboarding.

## Components Created

### 1. Database Schema

**File:** `supabase/migrations/20250407_compliance_system.sql`

Run this migration in your Supabase dashboard to create all necessary tables:

- `request_flow_compliance` - Request status tracking
- `user_activity_log` - User activity monitoring
- `compliance_evidence` - Evidence storage
- `onboarding_templates` - Tiered onboarding checklists
- `user_onboarding_progress` - Onboarding tracking
- `digital_signatures` - Signature storage
- `sla_definitions` - SLA threshold configurations

### 2. Context & Hooks

**File:** `contexts/ComplianceContext.tsx`

Provides state management and data fetching for compliance features.

**Usage:**

```typescript
import { useCompliance } from '@/contexts/ComplianceContext';

const {
  requestFlowData,
  userActivityLogs,
  complianceEvidence,
  onboardingTemplates,
  dashboardData,
  fetchRequestFlowCompliance,
  logActivity,
  submitEvidence,
  startOnboarding,
} = useCompliance();
```

### 3. UI Components

#### ComplianceDashboard

**File:** `components/ComplianceDashboard.tsx`

Comprehensive dashboard showing:

- Request flow statistics
- SLA compliance rates
- User activity metrics
- Average durations by stage

**Usage:**

```typescript
import { ComplianceDashboard } from '@/components/ComplianceDashboard';

<ComplianceDashboard
  onRequestDetail={(requestId) => navigateToRequest(requestId)}
  onUserDetail={(userId) => navigateToUser(userId)}
/>
```

#### ComplianceEvidence

**File:** `components/ComplianceEvidence.tsx`

Modal for submitting compliance evidence:

- File uploads
- Digital signatures
- Checklist confirmations
- Notes/observations

**Usage:**

```typescript
import { ComplianceEvidence } from '@/components/ComplianceEvidence';

const [showEvidence, setShowEvidence] = useState(false);

<ComplianceEvidence
  requestId={requestId}
  visible={showEvidence}
  onClose={() => setShowEvidence(false)}
  onEvidenceSubmitted={() => {
    // Refresh request data
  }}
/>
```

#### OnboardingFlow

**File:** `components/OnboardingFlow.tsx`

Tiered onboarding system:

- Basic: For regular users
- Supervisor: For supervisors/approvers
- Admin: For system administrators

**Usage:**

```typescript
import { OnboardingFlow } from '@/components/OnboardingFlow';

const [showOnboarding, setShowOnboarding] = useState(false);

<OnboardingFlow
  visible={showOnboarding}
  onClose={() => setShowOnboarding(false)}
  onComplete={() => {
    // Onboarding completed
  }}
/>
```

#### ComplianceIndicator

**File:** `components/ComplianceIndicator.tsx`

Compact indicator showing request compliance status.

**Usage:**

```typescript
import { ComplianceIndicator } from '@/components/ComplianceIndicator';

<ComplianceIndicator
  requestId={requestId}
  compact={true}
  onPress={() => navigateToComplianceDetail(requestId)}
/>
```

## Contextual Integration

### In Requests Screen (`app/(tabs)/requests.tsx`)

#### 1. Add Compliance Indicator to Request Cards

```typescript
import { ComplianceIndicator } from '@/components/ComplianceIndicator';

// Inside your request card render:
<View style={styles.requestCard}>
  {/* Existing request info */}
  <Text style={styles.requestTitle}>{request.title}</Text>

  {/* Add compliance indicator */}
  <ComplianceIndicator
    requestId={request.id}
    compact={true}
    style={styles.complianceIndicator}
  />
</View>
```

#### 2. Add Evidence Button to Request Actions

```typescript
import { ComplianceEvidence } from '@/components/ComplianceEvidence';

// Add to request detail modal or action menu:
<TouchableOpacity
  style={styles.actionButton}
  onPress={() => setShowEvidence(true)}
>
  <FileText size={20} color={colors.primary} />
  <Text>Evidencia</Text>
</TouchableOpacity>

<ComplianceEvidence
  requestId={selectedRequest.id}
  visible={showEvidence}
  onClose={() => setShowEvidence(false)}
  onEvidenceSubmitted={() => {
    // Refresh request data
    fetchRequests();
  }}
/>
```

#### 3. Track Request Status Changes

```typescript
import { useCompliance } from '@/contexts/ComplianceContext';

const { updateRequestFlowStatus, logActivity } = useCompliance();

// When approving a request:
const handleApproveRequest = async requestId => {
  try {
    // Update request in database
    await updateRequest(requestId, { status: 'approved' });

    // Track compliance flow
    await updateRequestFlowStatus(requestId, 'approved', user.id);

    // Log activity
    await logActivity('request_approved', { requestId }, requestId);
  } catch (error) {
    console.error('Error approving request:', error);
  }
};
```

### In Chat Screen (`app/(tabs)/chat/[roomId].tsx`)

#### 1. Add Activity Logging

```typescript
import { useCompliance } from '@/contexts/ComplianceContext';

const { logActivity } = useCompliance();

// When sending messages:
const handleSendMessage = async () => {
  try {
    await sendMessage(messageText, roomId);

    // Log chat activity
    await logActivity('message_sent', { roomId }, undefined, roomId);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
```

#### 2. Add Onboarding Trigger for New Users

```typescript
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { useCompliance } from '@/contexts/ComplianceContext';

const { userOnboardingProgress } = useCompliance();

useEffect(() => {
  // Check if user needs onboarding
  if (
    !userOnboardingProgress ||
    userOnboardingProgress.status !== 'completed'
  ) {
    setShowOnboarding(true);
  }
}, [userOnboardingProgress]);
```

### In Profile Screen

#### 1. Add Compliance Stats

```typescript
import { useCompliance } from '@/contexts/ComplianceContext';

const { userActivityLogs, fetchUserActivity } = useCompliance();

useEffect(() => {
  fetchUserActivity(user.id, 10);
}, [user]);

// Display activity stats
<View style={styles.stats}>
  <Text>Actividad this week: {userActivityLogs.filter(log => isThisWeek(log.created_at)).length}</Text>
</View>
```

#### 2. Add Onboarding Progress

```typescript
import { ComplianceIndicator } from '@/components/ComplianceIndicator';

{userOnboardingProgress && (
  <View style={styles.onboardingCard}>
    <Text style={styles.onboardingTitle}>Progreso de Onboarding</Text>
    <Text>{userOnboardingProgress.progress_percentage}% completado</Text>
    {userOnboardingProgress.status !== 'completed' && (
      <Button onPress={() => setShowOnboarding(true)}>
        Continuar Onboarding
      </Button>
    )}
  </View>
)}
```

## Activity Logging Best Practices

### Log Important User Actions

```typescript
// File uploads
await logActivity(
  'file_upload',
  {
    fileName: file.name,
    fileSize: file.size,
  },
  requestId
);

// Request actions
await logActivity('request_created', { requestTitle: title });
await logActivity('request_approved', { requestId });
await logActivity('request_completed', { requestId, duration: totalDuration });

// Evidence actions
await logActivity(
  'evidence_added',
  {
    evidenceType: 'signature',
    requestTitle: request.title,
  },
  requestId
);

// Checklist completions
await logActivity('checklist_completed', {
  checklistId: template.id,
  itemsCompleted: progress.completedItems,
});

// Login/logout
await logActivity('login', { platform: Platform.OS });
await logActivity('logout', { sessionDuration });
```

## SLA Monitoring

### Setting SLA Thresholds

The system includes default SLA definitions:

- **SLA Estándar**: 24h aprobación, 72h ejecución, 96h total
- **SLA Urgente**: 4h aprobación, 24h ejecución, 48h total
- **SLA Emergencia**: 1h aprobación, 8h ejecución, 24h total
- **SLA Baja Prioridad**: 48h aprobación, 120h ejecución, 168h total

### Custom SLA per Request

```sql
-- In database, assign custom SLA:
INSERT INTO request_sla_mapping (request_id, sla_id, custom_approval_threshold, custom_execution_threshold, custom_total_threshold)
VALUES ('request-uuid', 'sla-uuid', 12, 48, 72);
```

## Digital Signatures

### Collecting Signatures

The `ComplianceEvidence` component includes a signature pad using `react-native-signature-canvas`.

**Installation:**

```bash
npm install react-native-signature-canvas
```

### Signature Storage

Signatures are automatically:

1. Stored in `digital_signatures` table
2. Linked to the entity (request/onboarding/evidence)
3. Timestamped with IP and device info
4. Logged as activity for audit trail

## Database Functions

### update_request_flow_status

Automatically tracks request status changes and calculates durations:

```typescript
await supabase.rpc('update_request_flow_status', {
  p_request_id: requestId,
  p_new_status: 'approved',
  p_user_id: userId,
});
```

### log_user_activity

Logs user activities for compliance tracking:

```typescript
await supabase.rpc('log_user_activity', {
  p_user_id: userId,
  p_activity_type: 'request_approved',
  p_request_id: requestId,
  p_metadata: { note: 'Fast approval' },
});
```

### update_onboarding_progress

Tracks onboarding completion:

```typescript
await supabase.rpc('update_onboarding_progress', {
  p_user_id: userId,
  p_item_id: itemId,
  p_response: { checked: true },
  p_evidence_id: evidenceId,
});
```

## Dashboard Integration

### Adding to Navigation

Add to your main tab navigation or create a dedicated compliance screen:

```typescript
// In app/(tabs)/_layout.tsx or similar:
<Tabs.Screen
  name="compliance"
  options={{
    title: 'Cumplimiento',
    tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
  }}
/>
```

### Dashboard Content

The dashboard automatically shows:

- Request flow stats (total, pending, approved, in progress, completed, rejected)
- SLA compliance rate
- User activity metrics
- Average durations (approval, execution, total)
- Top active users

## Permissions & RLS

All tables have Row Level Security (RLS) enabled:

- **Users** can view compliance data for their own requests
- **Admins** can view all compliance data
- **Evidence** can only be viewed by request participants
- **Onboarding** progress is user-specific

## Troubleshooting

### Migration Not Running

If tables don't exist:

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration file: `supabase/migrations/20250407_compliance_system.sql`
3. Verify tables created in Table Editor

### Compliance Data Not Showing

If compliance indicators don't appear:

1. Check that `ComplianceProvider` is in `ContextProviders.tsx`
2. Verify `request_flow_compliance` records exist for requests
3. Call `fetchRequestFlowCompliance(requestId)` manually

### Onboarding Not Starting

If onboarding doesn't trigger:

1. Check user role in `user_metadata.role`
2. Verify `onboarding_templates` exist for user's tier
3. Manually call `startOnboarding()` for debugging

### Signature Pad Not Working

If signature canvas fails:

1. Install `react-native-signature-canvas`
2. Rebuild the app: `npx expo start --clear`
3. Check console for signature-related errors

## Next Steps

1. **Run the migration** in Supabase Dashboard
2. **Test onboarding** flows for each tier (basic, supervisor, admin)
3. **Integrate indicators** in request cards
4. **Add evidence buttons** to request detail screens
5. **Monitor dashboard** for compliance metrics
6. **Customize SLA** thresholds per business needs
7. **Train users** on onboarding process

## Support

For issues or questions:

- Check Supabase logs for database errors
- Review React Native debugger for client errors
- Verify RLS policies in Supabase Dashboard
- Test compliance functions in SQL Editor

---

**System Status:** ✅ Implementation Complete
**Migration Required:** Yes (run 20250407_compliance_system.sql)
**Additional Dependencies:** react-native-signature-canvas
**Provider Status:** ✅ ComplianceProvider added to ContextProviders
