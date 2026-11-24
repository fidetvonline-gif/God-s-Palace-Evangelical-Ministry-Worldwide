import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFacebookVideoEmbedUrl,
  deduplicateAndNormalizeVideos,
  extractFacebookVideoId,
  extractFacebookVideosFromHtml,
  filterGoodFacebookVideos,
  generateCleanVideoTitle,
  isSafeFacebookUrl,
  normalizeFacebookText,
  parseDurationToSeconds,
  parseFacebookVideoCard,
  rankFacebookVideos,
} from './facebookVideoLogic.ts';

test('normalizeFacebookText converts Unicode mathematical bold/italic characters to readable text', () => {
  const raw = 'This is 𝐈𝐧 𝐭𝐡𝐞 𝐉𝐨𝐮𝐫𝐧𝐞𝐲 of Life · 𝙂𝙊𝘿 𝙏𝘼𝙇𝙆 𝙏𝙊 𝙈𝙀';
  assert.equal(normalizeFacebookText(raw), 'This is In the Journey of Life · GOD TALK TO ME');
});

test('isSafeFacebookUrl allows official HTTPS Facebook domains and blocks unsafe schemes', () => {
  assert.equal(
    isSafeFacebookUrl('https://www.facebook.com/100080364799775/videos/1507625324804658/'),
    true,
  );
  assert.equal(
    isSafeFacebookUrl('https://web.facebook.com/people/Gods-Palace-Evangelical-Ministry-Worldwide/100080364799775/'),
    true,
  );
  assert.equal(isSafeFacebookUrl('javascript:alert(1)'), false);
  assert.equal(isSafeFacebookUrl('https://evil.example.com/reel/123456789'), false);
});

test('extractFacebookVideoId and buildFacebookVideoEmbedUrl handle videos and reels', () => {
  const url = 'https://www.facebook.com/100080364799775/videos/pray-along/996191176261041/?foo=bar';
  assert.equal(extractFacebookVideoId(url), '996191176261041');
  assert.equal(
    buildFacebookVideoEmbedUrl(url),
    'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2F100080364799775%2Fvideos%2Fpray-along%2F996191176261041%2F&show_text=false',
  );
  assert.equal(parseDurationToSeconds('13:44'), 824);
  assert.equal(parseDurationToSeconds('1:02:05'), 3725);
});

test('parseFacebookVideoCard parses duration, title, relative date, views, and reactions', () => {
  const now = 1_795_480_000_000;
  const item = parseFacebookVideoCard(
    {
      url: 'https://www.facebook.com/100080364799775/videos/test/1507625324804658/?__cft__=abc',
      text: '13:44\n𝐈𝐧 𝐭𝐡𝐞 𝐉𝐨𝐮𝐫𝐧𝐞𝐲 𝐨𝐟 𝐋𝐢𝐟𝐞\n10 hours ago\n·\n101 views\n5',
      img: 'https://scontent-lhr11-1.xx.fbcdn.net/v/t15.5256-10/sample.jpg',
    },
    0,
    now,
  );

  assert.ok(item);
  assert.equal(item.id, '1507625324804658');
  assert.equal(item.title, 'In the Journey of Life');
  assert.equal(item.durationText, '13:44');
  assert.equal(item.durationSeconds, 824);
  assert.equal(item.publishedText, '10 hours ago');
  assert.equal(item.relativeAgeMinutes, 600);
  assert.equal(item.viewsCount, 101);
  assert.equal(item.reactionsCount, 5);
});

test('deduplicateAndNormalizeVideos merges duplicate featured cards and keeps richest metadata', () => {
  const now = 1_795_480_000_000;
  const featured = parseFacebookVideoCard(
    {
      url: 'https://www.facebook.com/100080364799775/videos/1626817355327228/',
      text: '0:00 / 4:55\n𝙂𝙊𝘿 𝙏𝘼𝙇𝙆 𝙏𝙊 𝙈𝙀',
    },
    0,
    now,
  )!;
  const grid = parseFacebookVideoCard(
    {
      url: 'https://www.facebook.com/100080364799775/videos/1626817355327228/',
      text: '4:56\n𝙂𝙊𝘿 𝙏𝘼𝙇𝙆 𝙏𝙊 𝙈𝙀\na day ago\n·\n90 views\n14',
    },
    3,
    now,
  )!;

  const merged = deduplicateAndNormalizeVideos([featured, grid]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].publishedText, 'a day ago');
  assert.equal(merged[0].viewsCount, 90);
  assert.equal(merged[0].reactionsCount, 14);
});

test('rankFacebookVideos ranks automatically by latest, popular, and duration', () => {
  const now = 1_795_480_000_000;
  const vLatest = parseFacebookVideoCard(
    {
      url: 'https://www.facebook.com/100080364799775/videos/1507625324804658/',
      text: '13:44\nLatest Purpose Message\n10 hours ago\n101 views\n5',
    },
    0,
    now,
  )!;
  const vPopular = parseFacebookVideoCard(
    {
      url: 'https://www.facebook.com/100080364799775/videos/996191176261041/',
      text: '4:27\nPray Along\na week ago\n290 views\n18',
    },
    2,
    now,
  )!;
  const vMedium = parseFacebookVideoCard(
    {
      url: 'https://www.facebook.com/100080364799775/videos/1448918506760884/',
      text: '6:34\nDivine Favour\n6 days ago\n142 views\n5',
    },
    1,
    now,
  )!;

  const byLatest = rankFacebookVideos([vPopular, vMedium, vLatest], 'latest');
  assert.deepEqual(
    byLatest.map((v) => v.id),
    ['1507625324804658', '1448918506760884', '996191176261041'],
  );

  const byPopular = rankFacebookVideos([vLatest, vMedium, vPopular], 'popular');
  assert.deepEqual(
    byPopular.map((v) => v.id),
    ['996191176261041', '1448918506760884', '1507625324804658'],
  );

  const byDuration = rankFacebookVideos([vPopular, vMedium, vLatest], 'duration');
  assert.deepEqual(
    byDuration.map((v) => v.id),
    ['1507625324804658', '1448918506760884', '996191176261041'],
  );
});

test('extractFacebookVideosFromHtml extracts videos from embedded latest_videos and all_videos JSON', () => {
  const now = 1_795_477_088_000;
  const mockHtml = `
    <html><body><script>
    {"data":{"latest_videos":{"edges":[{"node":{"id":"1507625324804658","publish_time":1795441088,"play_count":101,"canonical_uri_with_fallback":"https://www.facebook.com/100080364799775/videos/1507625324804658/","image":{"uri":"https://scontent-lhr11-1.xx.fbcdn.net/v/t15.5256-10/a.jpg"},"savable_title":{"text":"𝐈𝐧 𝐭𝐡𝐞 𝐉𝐨𝐮𝐫𝐧𝐞𝐲 𝐨𝐟 𝐋𝐢𝐟𝐞"},"video_thumbnail_overlays_renderer":{"video":{"playable_duration":824}},"feedback":{"reaction_count":{"count":5}}}}]},"all_videos":{"edges":[{"node":{"id":"1507625324804658","channel_tab_thumbnail_renderer":{"video":{"id":"1507625324804658","savable_title":{"text":"In the Journey of Life"}}}}},{"node":{"id":"996191176261041","channel_tab_thumbnail_renderer":{"video":{"id":"996191176261041","publish_time":1794600000,"play_count":290,"canonical_uri_with_fallback":"https://www.facebook.com/100080364799775/videos/996191176261041/","image":{"uri":"https://scontent-lhr11-1.xx.fbcdn.net/v/t15.5256-10/b.jpg"},"savable_title":{"text":"Pray Along with Rev Dr Omorogieva Agbonmwanre Anthony"},"video_thumbnail_overlays_renderer":{"video":{"playable_duration":267}},"feedback":{"reaction_count":{"count":18}}}}}}]}}}
    </script></body></html>
  `;

  const extracted = extractFacebookVideosFromHtml(mockHtml, '100080364799775', now);
  assert.equal(extracted.length, 2);
  assert.equal(extracted[0].id, '1507625324804658');
  assert.equal(extracted[0].title, 'In the Journey of Life');
  assert.equal(extracted[0].durationText, '13:44');
  assert.equal(extracted[0].viewsCount, 101);
  assert.equal(extracted[0].reactionsCount, 5);
  assert.equal(extracted[0].publishedText, '10 hours ago');
  assert.equal(extracted[1].id, '996191176261041');
  assert.equal(extracted[1].title, 'Pray Along with Rev Dr Omorogieva Agbonmwanre Anthony');
  assert.equal(extracted[1].durationText, '4:27');
  assert.equal(extracted[1].viewsCount, 290);
  assert.equal(extracted[1].reactionsCount, 18);
  assert.equal(extracted[1].thumbnailUrl, 'https://scontent-lhr11-1.xx.fbcdn.net/v/t15.5256-10/b.jpg');
});

test('generateCleanVideoTitle automatically creates clean sermon titles from messy captions and untitled uploads', () => {
  assert.equal(
    generateCleanVideoTitle(
      "This is a Timely Purposeful Message Titled 𝐈𝐧 𝐭𝐡𝐞 𝐉𝐨𝐮𝐫𝐧𝐞𝐲 𝐨𝐟 𝐋𝐢𝐟𝐞 𝐃𝐨𝐧'𝐭 𝐠𝐨 𝐰𝐢𝐭𝐡𝐨𝐮𝐭 𝐚 𝐏𝐮𝐫𝐩𝐨𝐬𝐞 listen that Be Blessed.",
      824,
    ),
    "In the Journey of Life Don't go without a Purpose",
  );

  assert.equal(
    generateCleanVideoTitle(
      'THIS MESSAGE WILL CERTAINLY INCREASE YOUR COURAGE IN THE JOURNEY OF LIFE. WHAT A POWERFUL MESSAGE TITLED IN THIS JOURNEY OF LIFE GO WITH COURAGE.STAY BLESS AS YOU LISTEN',
      762,
    ),
    'In This Journey of Life Go with Courage',
  );

  assert.equal(
    generateCleanVideoTitle("God's Palace Evangelical Ministry Worldwide's video", 96),
    "Short Word & Prayer Charge — God's Palace Ministry",
  );

  assert.equal(
    generateCleanVideoTitle('', 45),
    "Sanctuary Praise & Ministry Highlight — God's Palace",
  );
});

test('filterGoodFacebookVideos filters out empty/broken clips and keeps valid church videos', () => {
  const now = 1_795_480_000_000;
  const good = parseFacebookVideoCard(
    {
      url: 'https://www.facebook.com/100080364799775/videos/1507625324804658/',
      text: '13:44\nIn the Journey of Life\n10 hours ago\n101 views',
      img: 'https://scontent-lhr11-1.xx.fbcdn.net/v/t15.5256-10/sample.jpg',
    },
    0,
    now,
  )!;
  const broken = parseFacebookVideoCard(
    {
      url: 'https://www.facebook.com/100080364799775/videos/999999999999999/',
      text: 'Deleted video',
    },
    1,
    now,
  )!;

  const screened = filterGoodFacebookVideos([good, broken]);
  assert.equal(screened.length, 1);
  assert.equal(screened[0].id, '1507625324804658');
});

