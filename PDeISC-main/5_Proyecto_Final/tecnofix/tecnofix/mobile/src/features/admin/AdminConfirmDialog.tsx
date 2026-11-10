import { Modal, Pressable, Text, View } from 'react-native';
import { Button, Message, colors, styles } from '../../ui';
import type { Technician } from '../../types';

export type TechnicianAction = 'activate' | 'deactivate' | 'delete';

const actionContent: Record<TechnicianAction, {
  title: string;
  confirmLabel: string;
  description: (technician: Technician) => string;
  danger: boolean;
}> = {
  activate: {
    title: 'Activar técnico',
    confirmLabel: 'Activar técnico',
    description: (technician) => `¿Querés volver a activar a ${technician.nombre} ${technician.apellido}? Podrá ingresar y recibir consultas nuevamente.`,
    danger: false,
  },
  deactivate: {
    title: 'Desactivar técnico',
    confirmLabel: 'Desactivar',
    description: (technician) => `¿Querés desactivar a ${technician.nombre} ${technician.apellido}? Sus consultas activas volverán a la cola para reasignarse.`,
    danger: false,
  },
  delete: {
    title: 'Eliminar técnico',
    confirmLabel: 'Eliminar técnico',
    description: (technician) => `¿Querés eliminar a ${technician.nombre} ${technician.apellido}? No podrá ingresar, pero se conservará su historial.`,
    danger: true,
  },
};

interface AdminConfirmDialogProps {
  technician: Technician | null;
  action: TechnicianAction | null;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AdminConfirmDialog({
  technician,
  action,
  busy,
  error,
  onCancel,
  onConfirm,
}: AdminConfirmDialogProps) {
  const content = action ? actionContent[action] : null;
  const visible = !!technician && !!content;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <View style={dialogStyles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar diálogo"
          disabled={busy}
          onPress={onCancel}
          style={dialogStyles.dismissLayer}
        />
        {technician && content && (
          <View
            accessibilityViewIsModal
            style={dialogStyles.card}
          >
            <View style={[dialogStyles.icon, content.danger && dialogStyles.dangerIcon]}>
              <Text style={[dialogStyles.iconText, content.danger && dialogStyles.dangerText]}>
                {content.danger ? '!' : '?'}
              </Text>
            </View>
            <Text accessibilityRole="header" style={dialogStyles.title}>{content.title}</Text>
            <Text style={dialogStyles.description}>{content.description(technician)}</Text>
            {!!error && <Message>{error}</Message>}
            <View style={dialogStyles.actions}>
              <Button small title="Cancelar" variant="secondary" disabled={busy} onPress={onCancel} />
              <Button
                small
                title={busy ? 'Procesando…' : content.confirmLabel}
                variant={content.danger ? 'danger' : 'primary'}
                disabled={busy}
                onPress={onConfirm}
              />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const dialogStyles = {
  backdrop: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 22,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  dismissLayer: {
    ...({ position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 }),
  },
  card: {
    width: '100%' as const,
    maxWidth: 440,
    gap: 12,
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    elevation: 12,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 15,
    backgroundColor: colors.secondarySurface,
  },
  dangerIcon: { backgroundColor: colors.dangerSurface },
  iconText: { color: colors.primaryDark, fontSize: 20, fontWeight: '900' as const },
  dangerText: { color: colors.danger },
  title: { color: colors.text, fontSize: 21, fontWeight: '900' as const },
  description: { ...styles.muted, lineHeight: 22 },
  actions: { flexDirection: 'row' as const, justifyContent: 'flex-end' as const, flexWrap: 'wrap' as const, gap: 10, marginTop: 4 },
};
