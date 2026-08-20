import { Fragment, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../src/auth/SessionContext';
import { Card, CardGroup, Group, Separator } from '../../src/components/Group';
import { Chevron, Row, RowText } from '../../src/components/Row';
import { Screen } from '../../src/components/Screen';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { Sheet } from '../../src/components/Sheet';
import {
  CLASS_AVERAGE,
  CURRENT_SEMESTER,
  SEMESTERS,
  SUBJECTS,
  examsFor,
} from '../../src/data/mock';
import {
  color,
  deltaColor,
  formatDelta,
  gradeColor,
  layout,
  tabularNums,
  type,
} from '../../src/theme';

/** Noten: the semester average up top, then one quiet row per subject. */
export default function Noten() {
  const { role } = useSession();
  const teacher = role === 'lehrperson';

  const [semesterIndex, setSemesterIndex] = useState(CURRENT_SEMESTER);
  const [openSubject, setOpenSubject] = useState<string | null>(null);

  const semester = SEMESTERS[semesterIndex];
  const subjects = SUBJECTS[semester.label];
  const delta = semester.avg - semester.prev;
  const average = teacher ? CLASS_AVERAGE : semester.avg;

  const subject = subjects.find((entry) => entry.name === openSubject) ?? null;
  const exams = subject ? examsFor(subject.name) : [];

  return (
    <>
      <Screen
        title="Noten"
        belowTitle={
          <View style={styles.segments}>
            <SegmentedControl
              segments={SEMESTERS.map((entry) => ({ label: entry.label }))}
              selectedIndex={semesterIndex}
              onChange={setSemesterIndex}
            />
          </View>
        }
      >
        <Group
          title={`${teacher ? 'Klassenschnitt' : 'Notenschnitt'} ${semester.label}`}
        >
          <Card style={styles.avgCard}>
            <Text style={styles.avgMeta} numberOfLines={1}>
              {teacher
                ? '3 von 24 unter der Promotionsgrenze'
                : 'Promotion erreicht · 1 Fach ungenügend'}
            </Text>
            <View style={styles.avgValueWrap}>
              <Text style={type.statValue}>{average.toFixed(2)}</Text>
              <Text style={[type.delta, { color: deltaColor(delta) }]}>
                {formatDelta(delta)}
              </Text>
            </View>
          </Card>
        </Group>

        <CardGroup title={teacher ? 'Fächer der Klasse' : 'Fächer'}>
          {subjects.map((entry, index) => {
            const trend = entry.grade - entry.prev;
            return (
              <Fragment key={entry.name}>
                {index > 0 && <Separator />}
                <Row onPress={() => setOpenSubject(entry.name)}>
                  <RowText
                    title={entry.name.split(' — ')[0]}
                    subtitle={`${entry.count} Noten · ${entry.teacher}`}
                  />
                  <Text style={[styles.trend, { color: deltaColor(trend) }]}>
                    {(trend >= 0 ? '↑' : '↓') + Math.abs(trend).toFixed(1)}
                  </Text>
                  <Text style={[styles.grade, { color: gradeColor(entry.grade) }]}>
                    {entry.grade.toFixed(1)}
                  </Text>
                  <Chevron />
                </Row>
              </Fragment>
            );
          })}
        </CardGroup>
      </Screen>

      <Sheet
        visible={subject != null}
        kicker={subject ? `${semester.label} · ${subject.teacher}` : undefined}
        title={subject ? subject.name.split(' — ')[0] : undefined}
        onClose={() => setOpenSubject(null)}
      >
        {subject != null && (
          <>
            <Card style={styles.detailHead}>
              <Text style={styles.detailAvg}>{subject.grade.toFixed(1)}</Text>
              <Text
                style={[
                  styles.detailDelta,
                  { color: deltaColor(subject.grade - subject.prev) },
                ]}
              >
                {formatDelta(subject.grade - subject.prev, 1)}
              </Text>
              <Text style={styles.detailCompare}>
                Klasse Ø 4.7 · {subject.count} Prüfungen
              </Text>
            </Card>

            <Text style={styles.examsHeader}>Prüfungen</Text>
            <Card style={styles.sheetCard}>
              {exams.map((exam, index) => (
                <Fragment key={exam.name}>
                  {index > 0 && <Separator />}
                  <Row>
                    <RowText
                      title={exam.name}
                      subtitle={`${exam.meta} · Gewicht ${exam.weight}`}
                    />
                    <Text style={[styles.grade, { color: gradeColor(exam.grade) }]}>
                      {exam.grade.toFixed(1)}
                    </Text>
                  </Row>
                </Fragment>
              ))}
            </Card>
          </>
        )}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  segments: {
    marginHorizontal: layout.gutter,
    marginBottom: layout.groupGap,
  },
  avgCard: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  avgMeta: {
    flex: 1,
    ...type.body,
    color: color.inkSecondary,
  },
  avgValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  trend: {
    fontSize: 15,
    fontWeight: '600',
    ...tabularNums,
  },
  grade: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
    ...tabularNums,
  },
  // The sheet body is already inset, so cards inside it drop their margin.
  sheetCard: {
    marginHorizontal: 0,
  },
  detailHead: {
    marginHorizontal: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  detailAvg: {
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -1.5,
    lineHeight: 40,
    color: color.ink,
    ...tabularNums,
  },
  detailDelta: {
    fontSize: 16,
    fontWeight: '600',
    paddingBottom: 5,
    ...tabularNums,
  },
  detailCompare: {
    ...type.secondary,
    paddingBottom: 5,
  },
  examsHeader: {
    ...type.sectionHeader,
    marginTop: 26,
    marginBottom: 7,
    paddingHorizontal: 2,
  },
});
