import { Fragment, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../src/auth/SessionContext';
import { Card, CardGroup, Group, SectionHeader, Separator } from '../../src/components/Group';
import { Chevron, Row, RowText } from '../../src/components/Row';
import { Screen } from '../../src/components/Screen';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import {
  GOALS,
  INITIAL_DONE_GOALS,
  SOL_FEEDBACK,
  SOL_SLOTS,
} from '../../src/data/mock';
import { color, layout, tabularNums, type } from '../../src/theme';

/** SOL: the booked slot as the main object, then goals, files and feedback. */
export default function Sol() {
  const { role } = useSession();
  const teacher = role === 'lehrperson';

  const [slotIndex, setSlotIndex] = useState(0);
  const [done, setDone] = useState<number[]>(INITIAL_DONE_GOALS);

  const slot = SOL_SLOTS[slotIndex];
  const completed = done.length;

  const toggleGoal = (index: number) =>
    setDone((current) =>
      current.includes(index)
        ? current.filter((entry) => entry !== index)
        : [...current, index],
    );

  const infoRows = teacher
    ? [
        { label: 'Lernjournale', value: '8 offen' },
        { label: 'Dokumente', value: '4 Dateien' },
      ]
    : [
        { label: 'Dokumente', value: '4 Dateien' },
        { label: 'Zeit erfasst', value: '3 h 20' },
      ];

  return (
    <Screen title="SOL">
      <Group title={teacher ? 'Begleitung' : 'Gebuchter Slot'}>
        <Card style={styles.slotCard}>
          <View style={styles.slotHead}>
            <Text style={styles.slotTime}>{slot.time}</Text>
            <Text numberOfLines={1} style={styles.slotWhere}>
              {teacher ? 'D 1 · 18 Lernende' : `Lernlandschaft ${slot.room} · HFM`}
            </Text>
          </View>
          <View style={styles.slotPicker}>
            <SegmentedControl
              segments={SOL_SLOTS.map((entry) => ({
                label: entry.time,
                disabled: entry.full,
              }))}
              selectedIndex={slotIndex}
              onChange={setSlotIndex}
              tabularValues
            />
          </View>
        </Card>
      </Group>

      <Group>
        <View style={styles.goalsHeader}>
          <SectionHeader>Lernziele</SectionHeader>
          <Text style={styles.progress}>
            {completed} von {GOALS.length}
          </Text>
        </View>
        <Card>
          {GOALS.map((goal, index) => {
            const checked = done.includes(index);
            return (
              <Fragment key={goal.text}>
                {index > 0 && <Separator />}
                <Row onPress={() => toggleGoal(index)}>
                  <View
                    style={[styles.checkbox, checked && styles.checkboxChecked]}
                  >
                    {checked && <Text style={styles.checkGlyph}>✓</Text>}
                  </View>
                  <RowText
                    title={goal.text}
                    subtitle={goal.meta}
                    titleStyle={
                      checked
                        ? {
                            color: color.inkSecondary,
                            textDecorationLine: 'line-through',
                          }
                        : undefined
                    }
                  />
                </Row>
              </Fragment>
            );
          })}
        </Card>
      </Group>

      <CardGroup>
        {infoRows.map((row, index) => (
          <Fragment key={row.label}>
            {index > 0 && <Separator />}
            <Row onPress={() => {}}>
              <Text style={[type.body, styles.infoLabel]}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
              <Chevron />
            </Row>
          </Fragment>
        ))}
      </CardGroup>

      <Group title="Rückmeldung">
        <Card style={styles.feedbackCard}>
          <Text style={styles.feedbackText}>{SOL_FEEDBACK.text}</Text>
          <Text style={styles.feedbackMeta}>{SOL_FEEDBACK.meta}</Text>
        </Card>
      </Group>
    </Screen>
  );
}

const styles = StyleSheet.create({
  slotCard: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  slotHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  slotTime: {
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -1.1,
    lineHeight: 32,
    color: color.ink,
    ...tabularNums,
  },
  slotWhere: {
    flex: 1,
    ...type.body,
    color: color.inkSecondary,
  },
  slotPicker: {
    marginTop: 16,
  },
  goalsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 7,
    paddingHorizontal: layout.gutter,
  },
  progress: {
    fontSize: 13,
    fontWeight: '600',
    color: color.green,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: color.green,
    backgroundColor: color.green,
  },
  checkGlyph: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  infoLabel: {
    flex: 1,
  },
  infoValue: {
    ...type.body,
    color: color.inkSecondary,
  },
  feedbackCard: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 17,
  },
  feedbackText: {
    ...type.body,
    lineHeight: 25,
  },
  feedbackMeta: {
    ...type.secondary,
    marginTop: 8,
  },
});
