import { Fragment } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../src/auth/SessionContext';
import { Card, CardGroup, Group, Separator } from '../../src/components/Group';
import { PressableCard, Row, RowText } from '../../src/components/Row';
import { Screen } from '../../src/components/Screen';
import { TODAY_LABEL, homeContent } from '../../src/data/mock';
import { color, deltaColor, formatDelta, layout, tabularNums, type } from '../../src/theme';

/**
 * Start: the day at a glance in four calm groups — next lesson, what's coming,
 * the term average, and the latest notice from the school.
 */
export default function Start() {
  const router = useRouter();
  const { role } = useSession();
  const content = homeContent(role);

  return (
    <Screen title={content.hello} subtitle={TODAY_LABEL}>
      <Group title="Nächste Lektion">
        <PressableCard onPress={() => router.push('/plan')} style={styles.nowCard}>
          <Text style={styles.nowTitle}>{content.nowTitle}</Text>
          <View style={styles.nowMeta}>
            <Text style={styles.nowSpan}>{content.nowSpan}</Text>
            <Text style={styles.nowRoom}>{content.nowRoom}</Text>
            <Text style={styles.nowTeacher}>{content.nowTeacher}</Text>
          </View>
          <Text style={styles.countdown}>{content.nowCountdown}</Text>
        </PressableCard>
      </Group>

      <CardGroup title="Prüfungen und Termine">
        {content.upcoming.map((item, index) => (
          <Fragment key={item.title}>
            {index > 0 && <Separator strong />}
            <Row onPress={() => router.push('/plan')}>
              <Text
                style={[
                  styles.date,
                  { color: item.urgent ? color.coral : color.inkSecondary },
                ]}
              >
                {item.date}
              </Text>
              <RowText title={item.title} subtitle={item.meta} />
            </Row>
          </Fragment>
        ))}
      </CardGroup>

      <Group title={content.avgTitle}>
        <PressableCard onPress={() => router.push('/noten')} style={styles.avgCard}>
          <Text style={styles.avgMeta} numberOfLines={1}>
            {content.avgMeta}
          </Text>
          <View style={styles.avgValueWrap}>
            <Text style={type.statValue}>{content.avgValue}</Text>
            <Text style={[type.delta, { color: deltaColor(content.avgDelta) }]}>
              {formatDelta(content.avgDelta)}
            </Text>
          </View>
        </PressableCard>
      </Group>

      <Group title={content.notice.from}>
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>{content.notice.title}</Text>
          <Text style={styles.noticeMeta}>{content.notice.meta}</Text>
        </Card>
      </Group>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nowCard: {
    backgroundColor: color.card,
    borderRadius: layout.cardRadius,
    marginHorizontal: layout.gutter,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 17,
  },
  nowTitle: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.8,
    lineHeight: 30,
    color: color.ink,
  },
  nowMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.hairline,
  },
  nowSpan: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.4,
    color: color.ink,
    ...tabularNums,
  },
  nowRoom: {
    ...type.body,
    color: color.inkSecondary,
  },
  nowTeacher: {
    marginLeft: 'auto',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: color.navy,
  },
  countdown: {
    marginTop: 11,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
    color: color.navy,
  },
  date: {
    width: 56,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
    ...tabularNums,
  },
  avgCard: {
    backgroundColor: color.card,
    borderRadius: layout.cardRadius,
    marginHorizontal: layout.gutter,
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
  noticeCard: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 17,
  },
  noticeTitle: {
    ...type.body,
    lineHeight: 24,
  },
  noticeMeta: {
    ...type.secondary,
    marginTop: 7,
  },
});
