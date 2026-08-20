import { Fragment, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, CardGroup, Group, Separator } from '../../src/components/Group';
import { Chevron, Row, RowText } from '../../src/components/Row';
import { Screen } from '../../src/components/Screen';
import {
  CHANGE_LINE,
  PREVIOUS_ROOM,
  TEACHER_LEGEND,
  TODAY_INDEX,
  WEEK_DAYS,
  lessonsForDay,
} from '../../src/data/mock';
import { color, layout, tabularNums, type } from '../../src/theme';

/** Stundenplan: pick a day, read the lessons, expand the teacher abbreviations. */
export default function Plan() {
  const [dayIndex, setDayIndex] = useState(TODAY_INDEX);
  const [legendOpen, setLegendOpen] = useState(false);

  const day = WEEK_DAYS[dayIndex];
  const lessons = lessonsForDay(dayIndex);
  const hasChanges = dayIndex === TODAY_INDEX;

  return (
    <Screen
      title="Stundenplan"
      belowTitle={
        <View style={styles.days}>
          {WEEK_DAYS.map((entry, index) => {
            const active = index === dayIndex;
            return (
              <Pressable
                key={entry.dow}
                onPress={() => setDayIndex(index)}
                accessibilityRole="button"
                accessibilityState={active ? { selected: true } : {}}
                style={({ pressed }) => [styles.day, pressed && styles.dayPressed]}
              >
                <Text style={styles.dayName}>{entry.dow}</Text>
                <View style={[styles.dayDate, active && styles.dayDateActive]}>
                  <Text
                    style={[styles.dayDateText, active && styles.dayDateTextActive]}
                  >
                    {entry.date}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      }
    >
      {hasChanges && (
        <Group title="Änderungen">
          <Card style={styles.changeCard}>
            <Text style={styles.changeText}>{CHANGE_LINE}</Text>
          </Card>
        </Group>
      )}

      <CardGroup title={day.title}>
        {lessons.map((lesson, index) => {
          const cancelled = lesson.state === 'cancelled';
          const moved = lesson.state === 'roomChange';
          const meta = moved
            ? `${lesson.room} statt ${PREVIOUS_ROOM} · ${lesson.teacher}`
            : cancelled
              ? 'Fällt aus'
              : `${lesson.room} · ${lesson.teacher}`;
          return (
            <Fragment key={`${lesson.start}-${lesson.subject}`}>
              {index > 0 && <Separator />}
              <View style={styles.lesson}>
                <Text
                  style={[
                    styles.time,
                    { color: cancelled ? color.inkDisabled : color.inkSecondary },
                  ]}
                >
                  {lesson.start}
                </Text>
                <RowText
                  title={lesson.subject}
                  subtitle={meta}
                  titleStyle={
                    cancelled
                      ? { color: color.inkSecondary, textDecorationLine: 'line-through' }
                      : undefined
                  }
                  subtitleStyle={moved ? { color: color.red } : undefined}
                />
              </View>
            </Fragment>
          );
        })}
      </CardGroup>

      <Group>
        <Card>
          <Row onPress={() => setLegendOpen((open) => !open)}>
            <Text style={[type.body, styles.legendLabel]}>Kürzel Lehrpersonen</Text>
            <Chevron rotated={legendOpen} />
          </Row>
          {legendOpen &&
            TEACHER_LEGEND.map((entry) => (
              <Fragment key={entry.abbr}>
                <Separator strong />
                <View style={styles.legendRow}>
                  <Text style={styles.legendAbbr}>{entry.abbr}</Text>
                  <Text numberOfLines={1} style={styles.legendName}>
                    {entry.name}
                  </Text>
                  <Text style={type.secondary}>{entry.subject}</Text>
                </View>
              </Fragment>
            ))}
        </Card>
      </Group>
    </Screen>
  );
}

const styles = StyleSheet.create({
  days: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 26,
    gap: 4,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  dayPressed: {
    transform: [{ scale: 0.94 }],
  },
  dayName: {
    fontSize: 13,
    fontWeight: '500',
    color: color.inkSecondary,
  },
  dayDate: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDateActive: {
    backgroundColor: color.navy,
  },
  dayDateText: {
    fontSize: 16,
    fontWeight: '400',
    color: color.navy,
    ...tabularNums,
  },
  dayDateTextActive: {
    fontWeight: '600',
    color: '#fff',
  },
  changeCard: {
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  changeText: {
    ...type.body,
    color: color.red,
    lineHeight: 24,
  },
  lesson: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: layout.rowPaddingH,
    paddingVertical: 14,
  },
  time: {
    width: 52,
    fontSize: 16,
    letterSpacing: -0.2,
    ...tabularNums,
  },
  legendLabel: {
    flex: 1,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: layout.rowPaddingH,
    paddingVertical: 13,
  },
  legendAbbr: {
    width: 52,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: color.navy,
  },
  legendName: {
    flex: 1,
    minWidth: 0,
    ...type.body,
  },
});
